/**
 * @title Switch change notified on Telegram
 * @description This script monitor the status of the output switch of
 *   Shelly device and notify with message on Telegram Bot each time the
 *   output is turned on or off. Provide info on the trigger source 
 *   (Application, web, physical button) and ON-time.
 * @status production
 * @link 
 */


// Configuration
let CONFIG = {
  DEBUG: true,
  
  // Telegram Configuration
  TELEGRAM_TOKEN: "12345678:abunchofrandomcharacters",
  TELEGRAM_CHAT_ID: "<user_id>"
};

// Helper for memory-safe logging
function log(msg) {
  if (CONFIG.DEBUG) print("[SCRIPT-NAME] " + msg);
}

// Send Telegram Message
function sendTelegramMessage(msg) {
  let url = "https://api.telegram.org/bot" + CONFIG.TELEGRAM_TOKEN + "/sendMessage";

  Shelly.call("HTTP.POST", {
    url: url,
    content_type: "application/json",
    body: JSON.stringify({
      chat_id: CONFIG.TELEGRAM_CHAT_ID,
      text: msg
    })
  }, function(res, err) {
    if (err !== 0) { 
      log("Failed to send Telegram alert. Error: " + err); 
    }
  });
}


let turnOnTime = null;

Shelly.addStatusHandler(function(status) {
  // Check if the update is for our switch component
  if (status.component === "switch:0") {
    
    // 'delta.output' is present only when the state changes
    if (typeof status.delta.output !== "undefined") {
      let isOn = status.delta.output;
      let state = isOn ? "✅ ON" : "❌ OFF";
      let source = status.delta.source || "unknown";
      
      // "input" — physical/local switch
      // "HTTP" or "HTTP_in" — REST API call
      // "WS" — WebSocket (app)
      // "SHC" - Applicazione Shelly (sembra)
      // "MQTT" — MQTT command
      // "timer" — scheduled/auto
      let msg = "🏠 Caldaia Canonica: " + state;
      if (source === "input") {
        msg = msg + " (da interruttore 🔘)";
      } else if (source === "timer") {
        msg = msg + " (azione programmata)";
      } else if (source === "SHC") {
        msg = msg + " (via App 📱)";
      } else if (source === "WS" || source === "WS_in") {
        msg = msg + " (via Web 🖥️)";
      } else if (source === "HTTP" || source === "HTTP_in") {
        msg = msg + " (via URL 🔗)";
      }
      
      msg = msg + " [" + source + "]";
      
      if (isOn) {
        turnOnTime = Date.now();
      } else {
        if (turnOnTime !== null) {
          let elapsed = Date.now() - turnOnTime;
          let seconds = Math.floor(elapsed / 1000);
          let minutes = Math.floor(seconds / 60);
          let hours = Math.floor(minutes / 60);

          seconds = seconds % 60;
          minutes = minutes % 60;

          let duration = "";
          if (hours > 0)    duration += hours + "h ";
          if (minutes > 0)  duration += minutes + "m ";
          duration += seconds + "s";

          msg += "\n⏱️ Durata: " + duration;
          turnOnTime = null;
        }
      }
      
      sendTelegramMessage(msg);
    }
  }
});


log("Telegram notification running");
