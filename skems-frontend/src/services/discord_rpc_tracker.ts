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
    let stateMsg = "Home";

    switch (location.pathname) {
      case "/":
      case "/about":
      case "/portfolio":
        details = "In Home";
        stateMsg = "Idling";
        break;
      case "/dashboard":
        details = "Viewing Dashboard";
        stateMsg = "Tracking";
        break;
      case "/dashboard/equipments":
        details = "Viewing Equipments";
        stateMsg = "Analyzing";
        break;
      default:
        details = `Viewing ${location.pathname}`;
        stateMsg = "Active";
    }

    invoke("update_discord_rpc", { details: details, state_msg: stateMsg })
      .then(() => console.log("Rpc updated"))
      .catch((err) => console.error("Failed to update Discord RPC:", err));
  }, [location]);

  return null;
}
