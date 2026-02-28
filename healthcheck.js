/**
 * @title Shelly Periodic Ping Healthcheck
 * @description This script sends a periodic HTTP request for healthcheck
 *   First ping executes immediately on script start
 * @status production
 * @developer Simone Cangini (simone@simonecangini.it)
 */

// ========== CONFIGURATION ==========
let CONFIG = {
  DEBUG: true,
  TARGET_URL: "https://hc.cacs.it/ping/a587ac11-096f-48bb-8580-0c88b754f07a",    // URL to ping
  PERIOD_MINUTES: 10                            // Ping interval in minutes
};
// ===================================

let PERIOD_MS = CONFIG.PERIOD_MINUTES * 60 * 1000;  // Convert minutes to milliseconds
let timerHandle = null;

// Helper for memory-safe logging
function log(msg) {
  if (CONFIG.DEBUG) print("[HEALTHCHECK] " + msg);
}


// Performs the HTTP GET request to the target URL
function pingURL() {
    log("Pinging URL: ", CONFIG.TARGET_URL);
    
    Shelly.call(
        "HTTP.GET",
        { url: TARGET_URL, timeout: 10 },
        function(result, error_code, error_message) {
            if (error_code !== 0) {
                print("Error pinging URL:", error_code, error_message);
            } else {
                log("Ping successful - Status:", result.code);
                // Uncomment to see response body:
                // log("Response:", result.body);
            }
        }
    );
}

// Sets up the periodic timer
function startPeriodicPing() {
    // First ping immediately
    pingURL();
    
    // Schedule periodic pings
    timerHandle = Timer.set(
        PERIOD_MS,
        true,  // repeat = true for periodic execution
        function() {
            pingURL();
        }
    );
    
    print("Periodic ping started - Interval:", CONFIG.PERIOD_MINUTES, "minutes");
}

// Cleanup function (optional - for script management)
function stopPeriodicPing() {
    if (timerHandle !== null) {
        Timer.clear(timerHandle);
        timerHandle = null;
        print("Periodic ping stopped");
    }
}

// Start the periodic ping
startPeriodicPing();
