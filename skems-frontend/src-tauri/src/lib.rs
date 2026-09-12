use tauri::{WebviewUrl, WebviewWindowBuilder, window::Color, State};
use tauri_plugin_opener::OpenerExt;
use discord_presence::Client;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use log::{info, error};

const PROD_URL: &str = "https://skems-v2.vercel.app";
const DEV_URL: &str = "http://localhost:5173";

struct DiscordState {
  client: Arc<Mutex<Client>>,
  start_time: i64,
  current_details: Arc<Mutex<String>>,
  current_state: Arc<Mutex<String>>,
  is_dirty: Arc<AtomicBool>, // 1. Added a flag to notify the thread when React sends new text
}

#[tauri::command]
fn update_discord_rpc(
  details: String,
  state_msg: String,
  discord_state: State<'_, DiscordState>,
) -> Result<(), String> {
  // Cache the new strings received from the React frontend
  if let Ok(mut details_lock) = discord_state.current_details.lock() {
      *details_lock = details.clone();
  }
  if let Ok(mut state_lock) = discord_state.current_state.lock() {
      *state_lock = state_msg.clone();
  }
  
  // 2. Set the dirty flag to true so the background thread knows it needs to update Discord
  discord_state.is_dirty.store(true, Ordering::SeqCst);

  // Still attempt an immediate update in case the socket is already open
  if let Ok(mut client) = discord_state.client.lock() {
      let start_time = discord_state.start_time;
      let _ = client.set_activity(|activity| {
        activity
          .details(details)
          .state(state_msg)
          .timestamps(|t| t.start(start_time.try_into().unwrap()))
      });
  }

  info!("🎯 Discord RPC cached successfully via React invoke link!");
  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let client = Client::new(1534201118702309636);

  let boot_timestamp = std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)
    .unwrap()
    .as_secs() as i64;

  let is_connected = Arc::new(AtomicBool::new(false));
  
  let ready_flag = Arc::clone(&is_connected);
  client.on_ready(move |_ctx| {
      info!("✅ DISCORD STATUS: Connected successfully to the local Discord application!");
      ready_flag.store(true, Ordering::SeqCst);
  }).persist();

  let error_flag = Arc::clone(&is_connected);
  client.on_error(move |ctx| { 
      error!("❌ DISCORD ERROR: {:?}", ctx.event);
      error_flag.store(false, Ordering::SeqCst); 
  }).persist();

  let current_details = Arc::new(Mutex::new(String::from("Opening App...")));
  let current_state = Arc::new(Mutex::new(String::from("Loading dashboard")));
  let is_dirty = Arc::new(AtomicBool::new(false)); // Start as false until React updates it

  let shared_client = Arc::new(Mutex::new(client));
  let thread_client = Arc::clone(&shared_client);
  let thread_connected_flag = Arc::clone(&is_connected);
  
  let thread_details = Arc::clone(&current_details);
  let thread_state = Arc::clone(&current_state);
  let thread_dirty_flag = Arc::clone(&is_dirty);

  // 3. Launch the worker thread safely
  thread::spawn(move || {
      info!("🚀 Launching isolated Discord background worker thread...");
      
      let mut was_connected = false;

      loop {
          let connected = thread_connected_flag.load(Ordering::SeqCst);

          if !connected {
              info!("🔄 Attempting to bind to Discord local socket...");
              was_connected = false;
              
              if let Ok(mut client_lock) = thread_client.lock() {
                  client_lock.start(); 
              }
          } else {
              // 4. FIXED: If the connection just opened OR React updated the text, push the latest cache to Discord
              let needs_update = !was_connected || thread_dirty_flag.load(Ordering::SeqCst);

              if needs_update {
                  info!("🔄 Syncing latest React state cache directly to Discord profile...");
                  
                  let details_cached = thread_details.lock().unwrap().clone();
                  let state_cached = thread_state.lock().unwrap().clone();

                  if let Ok(mut client_lock) = thread_client.lock() {
                      let _ = client_lock.set_activity(|activity| {
                          activity
                            .details(details_cached)
                            .state(state_cached)
                            .timestamps(|t| t.start(boot_timestamp.try_into().unwrap()))
                      });
                      
                      // Clear the flags since Discord is now perfectly synchronized
                      thread_dirty_flag.store(false, Ordering::SeqCst);
                      was_connected = true;
                  }
              }
          }

          // Check for sync updates every 2 seconds for a snappier response
          thread::sleep(std::time::Duration::from_secs(2));
      }
  });

  tauri::Builder::default()
    .manage(DiscordState {
      client: shared_client,
      start_time: boot_timestamp,
      current_details,
      current_state,
      is_dirty,
    })
    .invoke_handler(tauri::generate_handler![update_discord_rpc])
    .plugin(
      tauri_plugin_opener::Builder::new()
        .open_js_links_on_click(false)
        .build(),
    )
    .setup(|app| {
      app.handle().plugin(
        tauri_plugin_log::Builder::default()
          .targets([
              tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
              tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir { file_name: None }),
          ])
          .level(log::LevelFilter::Info)
          .build(),
      )?;

      let nav_handle = app.handle().clone();
      let new_window_handle = app.handle().clone();
      let url = if cfg!(debug_assertions) {
        WebviewUrl::External(DEV_URL.parse().expect("valid dev url"))
      } else {
        WebviewUrl::External(PROD_URL.parse().expect("valid remote url"))
      };

      WebviewWindowBuilder::new(app, "main", url)
        .title("Sine Kultura")
        .inner_size(1440.0, 900.0)
        .min_inner_size(1024.0, 700.0)
        .center()
        .resizable(true)
        .background_color(Color(5, 5, 5, 255))
        .on_navigation(move |url| {
          let host = url.host_str().unwrap_or("");
          let is_app = host == "skems-v2.vercel.app"
            || host == "localhost"
            || host == "127.0.0.1";
          if !is_app {
            let handle = nav_handle.clone();
            let url_string = url.as_ref().to_string();
            tauri::async_runtime::spawn(async move {
              let _ = handle.opener().open_url(url_string, None::<&str>);
            });
          }
          is_app
        })
        .on_new_window(move |url, _features| {
          let handle = new_window_handle.clone();
          let url_string = url.to_string();
          tauri::async_runtime::spawn(async move {
            let _ = handle.opener().open_url(url_string, None::<&str>);
          });
          tauri::webview::NewWindowResponse::Deny
        })
        .build()?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
