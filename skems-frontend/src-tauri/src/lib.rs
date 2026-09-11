use tauri::{WebviewUrl, WebviewWindowBuilder, window::Color};
use tauri_plugin_opener::OpenerExt;

const PROD_URL: &str = "https://skems-v2.vercel.app";
const DEV_URL: &str = "http://localhost:5173";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      let handle = app.handle().clone();
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
            let handle = handle.clone();
            let url_string = url.as_ref().to_string();
            tauri::async_runtime::spawn(async move {
              let _ = handle.opener().open_url(url_string, None::<&str>);
            });
          }
          is_app
        })
        .build()?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}