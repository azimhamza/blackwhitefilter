// Background script for Focus Tree extension

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "focusGiveUp") {
        // User gave up from content script overlay
        
        // Get timer data to calculate elapsed time before clearing it
        chrome.storage.local.get(['timerActive', 'timerStartTime', 'timerDuration'], (timerData) => {
            if (timerData.timerActive && timerData.timerStartTime) {
                const elapsed = Math.floor((Date.now() - timerData.timerStartTime) / 1000);
                
                // Update stats - tree killed
                chrome.storage.local.get(['totalProductiveTime', 'treesGrownCount', 'treesKilledCount'], (statsData) => {
                    let totalTime = statsData.totalProductiveTime || 0;
                    let grown = statsData.treesGrownCount || 0;
                    let killed = statsData.treesKilledCount || 0;

                    // Update stats
                    killed += 1;
                    totalTime += elapsed;

                    console.log('Background: Updating stats for killed tree:', { totalTime, grown, killed, elapsed });

                    chrome.storage.local.set({
                        totalProductiveTime: totalTime,
                        treesGrownCount: grown,
                        treesKilledCount: killed
                    }, () => {
                        console.log('Background: Stats saved successfully - killed:', killed);
                    });
                });
            }
            
            // Clear the timer state
            chrome.storage.local.remove(['timerActive', 'timerStartTime', 'timerDuration']);
        });
        
        // Send message to all tabs to stop focus timer
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {action: "stopFocusTimer"}, () => {
                    // Ignore errors if tab can't receive messages
                    if (chrome.runtime.lastError) {
                        // Tab probably doesn't have content script
                    }
                });
            });
        });
    }
});

// Handle tab updates to apply filter to new pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Check if focus timer is active and notify the tab
        chrome.storage.local.get(['timerActive', 'timerStartTime', 'timerDuration'], (data) => {
            if (data.timerActive && data.timerStartTime && data.timerDuration) {
                const elapsed = Math.floor((Date.now() - data.timerStartTime) / 1000);
                const remaining = Math.max(0, data.timerDuration - elapsed);
                
                if (remaining > 0) {
                    chrome.tabs.sendMessage(tabId, {
                        action: "startFocusTimer",
                        duration: data.timerDuration,
                        startTime: data.timerStartTime
                    }, () => {
                        if (chrome.runtime.lastError) {
                            // Tab probably doesn't have content script yet
                        }
                    });
                }
            }
        });
    }
}); 