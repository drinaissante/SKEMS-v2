import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";

export default function DiscordRpcTracker() {
  const location = useLocation();

  useEffect(() => {
    const isTauri =
      typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

    if (!isTauri) {
      console.log("Discord RPC update skipped.");
      return;
    }

    let details = "Exploring App";
    let state_msg = "Home";

    switch (location.pathname) {
      case "/":
      case "/about":
      case "/portfolio":
        details = "In Home";
        state_msg = "Idling";
        break;
      case "/dashboard":
        details = "Viewing Dashboard";
        state_msg = "Tracking";
        break;
      case "/dashboard/equipments":
        details = "Viewing Equipments";
        state_msg = "Analyzing";
        break;
      default:
        details = `Viewing ${location.pathname}`;
        state_msg = "Active";
    }

    invoke("update_discord_rpc", { details: details, state_msg: state_msg })
      .then(() => console.log("Rpc updated"))
      .catch((err) => console.error("Failed to update Discord RPC:", err));
  }, [location]);

  return null;
}
