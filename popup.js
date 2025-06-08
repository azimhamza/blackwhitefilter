// Global variables for timer
let timerInterval = null;
let timerStartTime = null;
let timerDuration = 0; // in seconds

document.addEventListener('DOMContentLoaded', function () {
    // Website Filter Elements
    const websiteInput = document.getElementById('website');
    const addButton = document.getElementById('addButton');
    const websiteList = document.getElementById('websiteList');

    // Tree Timer Elements
    const timerDisplay = document.getElementById('timerDisplay');
    const minutesInput = document.getElementById('minutesInput');
    const secondsInput = document.getElementById('secondsInput');
    const startTimer = document.getElementById('startTimer');
    const stopTimer = document.getElementById('stopTimer');
    const timerStatus = document.getElementById('timerStatus');
    const treeLeaves = document.getElementById('treeLeaves');
    const treeContainer = document.getElementById('treeContainer');

    // Stats Elements
    const totalHours = document.getElementById('totalHours');
    const treesGrown = document.getElementById('treesGrown');
    const treesKilled = document.getElementById('treesKilled');

    // Check if all required elements exist
    if (!websiteInput || !addButton || !websiteList || !timerDisplay || !minutesInput || 
        !secondsInput || !startTimer || !stopTimer || !timerStatus || !treeLeaves || !treeContainer) {
        console.error('Some required elements are missing from the DOM');
        return;
    }

    // Function Definitions First
    function loadStats() {
        chrome.storage.local.get(['totalProductiveTime', 'treesGrownCount', 'treesKilledCount'], function(data) {
            if (chrome.runtime.lastError) {
                console.error('Error loading stats:', chrome.runtime.lastError);
                return;
            }

            const totalTime = data.totalProductiveTime || 0;
            const grown = data.treesGrownCount || 0;
            const killed = data.treesKilledCount || 0;

            console.log('loadStats called with data:', { totalTime, grown, killed });

            // Convert seconds to hours and display
            const hours = Math.floor(totalTime / 3600);
            const minutes = Math.floor((totalTime % 3600) / 60);
            
            if (totalHours) {
                if (hours > 0) {
                    totalHours.textContent = `${hours}h ${minutes}m`;
                } else if (minutes > 0) {
                    totalHours.textContent = `${minutes}m`;
                } else {
                    totalHours.textContent = '0m';
                }
                console.log('Updated totalHours to:', totalHours.textContent);
            }
            
            if (treesGrown) {
                treesGrown.textContent = grown.toString();
                console.log('Updated treesGrown to:', treesGrown.textContent);
            }
            
            if (treesKilled) {
                treesKilled.textContent = killed.toString();
                console.log('Updated treesKilled to:', treesKilled.textContent);
            }
        });
    }

    function updateStats(type, timeSpent = 0) {
        console.log('updateStats called:', type, 'timeSpent:', timeSpent);
        
        // Force immediate execution with a timeout to ensure proper context
        setTimeout(() => {
            // Use local storage for more reliable stats tracking
            chrome.storage.local.get(['totalProductiveTime', 'treesGrownCount', 'treesKilledCount'], function(data) {
                if (chrome.runtime.lastError) {
                    console.error('Error reading stats:', chrome.runtime.lastError);
                    return;
                }

                let totalTime = data.totalProductiveTime || 0;
                let grown = data.treesGrownCount || 0;
                let killed = data.treesKilledCount || 0;

                console.log('Current stats before update:', { totalTime, grown, killed });

                if (type === 'grown') {
                    grown += 1;
                    totalTime += timeSpent; // Add full duration for completed trees
                    console.log('Tree grown! New stats:', { totalTime, grown, killed });
                } else if (type === 'killed') {
                    killed += 1;
                    totalTime += timeSpent; // Add partial time for killed trees
                    console.log('Tree killed! New stats:', { totalTime, grown, killed });
                }

                const newStats = {
                    totalProductiveTime: totalTime,
                    treesGrownCount: grown,
                    treesKilledCount: killed
                };

                chrome.storage.local.set(newStats, function() {
                    if (chrome.runtime.lastError) {
                        console.error('Error saving stats:', chrome.runtime.lastError);
                        return;
                    }
                    console.log('Stats saved successfully:', newStats);
                    
                    // Force immediate UI update
                    setTimeout(() => {
                        loadStats();
                    }, 100);
                });
            });
        }, 50);
    }

    function loadWebsites() {
        chrome.storage.sync.get('websites', function (data) {
            const websites = data.websites || [];
            console.log('Loading websites:', websites);
            
            // Clear existing websites from DOM first
            if (websiteList) {
                const existingItems = websiteList.querySelectorAll('.website-item');
                existingItems.forEach(item => item.remove());
            }
            
            // Show/hide empty state
            const emptyState = document.getElementById('emptyState');
            if (websites.length === 0) {
                if (emptyState) emptyState.style.display = 'block';
            } else {
                if (emptyState) emptyState.style.display = 'none';
                websites.forEach(addWebsiteToList);
            }
        });
    }

    function loadTimerState() {
        chrome.storage.local.get(['timerActive', 'timerStartTime', 'timerDuration'], function(data) {
            if (data.timerActive && data.timerStartTime && data.timerDuration) {
                timerStartTime = data.timerStartTime;
                timerDuration = data.timerDuration;
                
                const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
                const remaining = Math.max(0, timerDuration - elapsed);
                
                if (remaining > 0) {
                    // Timer is still running
                    treeLeaves.className = 'tree-leaves growing';
                    startTimer.classList.add('hidden');
                    stopTimer.classList.remove('hidden');
                    timerStatus.textContent = 'Your focus tree is growing! Stay away from blocked sites.';
                    timerStatus.className = 'status-message status-active';
                    startTimerCountdown();
                } else {
                    // Timer should have completed
                    completeTimer();
                }
            }
        });
    }

    function setupTabSwitching() {
        const treeTab = document.getElementById('treeTab');
        const filterTab = document.getElementById('filterTab');
        const blockTab = document.getElementById('blockTab');
        
        if (treeTab) treeTab.addEventListener('click', () => switchTab('tree'));
        if (filterTab) filterTab.addEventListener('click', () => switchTab('filter'));
        if (blockTab) blockTab.addEventListener('click', () => switchTab('block'));
    }

    function switchTab(tabName) {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Remove active class from all tabs
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => tab.classList.remove('active'));
        
        // Show selected tab content
        const tabContent = document.getElementById(tabName + '-tab');
        if (tabContent) tabContent.classList.add('active');
        
        // Add active class to clicked tab
        if (tabName === 'tree') {
            const treeTab = document.getElementById('treeTab');
            if (treeTab) treeTab.classList.add('active');
        } else if (tabName === 'filter') {
            const filterTab = document.getElementById('filterTab');
            if (filterTab) filterTab.classList.add('active');
        } else if (tabName === 'block') {
            const blockTab = document.getElementById('blockTab');
            if (blockTab) blockTab.classList.add('active');
        }
    }

    // Initialize
    loadWebsites();
    loadTimerState();
    loadStats();
    setupTabSwitching();

    // Listen for storage changes to update stats in real-time
    chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (namespace === 'local' && (changes.totalProductiveTime || changes.treesGrownCount || changes.treesKilledCount)) {
            console.log('Stats changed in storage, reloading...');
            loadStats();
        }
    });

    addButton.addEventListener('click', function () {
        let website = websiteInput.value.trim();
        if (website) {
            website = website.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/+$/, '');
            chrome.storage.sync.get('websites', function (data) {
                const websites = data.websites || [];
                if (!websites.includes(website)) {
                    websites.push(website);
                    chrome.storage.sync.set({ websites }, function () {
                        addWebsiteToList(website);
                        websiteInput.value = '';
                        updateActiveTab();
                        
                        // Force update all tabs immediately (only web pages)
                        console.log('Updating all tabs with new website list...');
                        chrome.tabs.query({url: ["http://*/*", "https://*/*"]}, function(tabs) {
                            console.log(`Found ${tabs.length} web tabs to update`);
                            tabs.forEach((tab, index) => {
                                console.log(`Updating tab ${index + 1}/${tabs.length}: ${tab.url}`);
                                chrome.tabs.sendMessage(tab.id, {action: "applyFilter"}, function(response) {
                                    if (chrome.runtime.lastError) {
                                        console.log(`Could not connect to tab ${tab.id}: ${chrome.runtime.lastError.message}`);
                                        // Try injecting content script if it's missing (Manifest V3)
                                        chrome.scripting.executeScript({
                                            target: { tabId: tab.id },
                                            files: ['content.js']
                                        }).then(() => {
                                            console.log(`Injected content script and retrying...`);
                                            // Retry after injection
                                            setTimeout(() => {
                                                chrome.tabs.sendMessage(tab.id, {action: "applyFilter"});
                                            }, 500);
                                        }).catch((error) => {
                                            console.log(`Could not inject content script: ${error.message}`);
                                        });
                                    } else {
                                        console.log(`Successfully updated tab: ${tab.url}`);
                                    }
                                });
                            });
                        });
                    });
                }
            });
        }
    });

    function addWebsiteToList(website) {
        if (!websiteList) return;
        
        // Check if website already exists in DOM to prevent duplicates
        const existingItems = websiteList.querySelectorAll('.website-name');
        for (let item of existingItems) {
            if (item.textContent === website) {
                console.log('Website already exists in list:', website);
                return;
            }
        }
        
        console.log('Adding website to list:', website);
        
        // Hide empty state
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        const li = document.createElement('li');
        li.className = 'website-item';
        li.setAttribute('data-website', website); // Add data attribute for easier identification
        
        const websiteName = document.createElement('span');
        websiteName.className = 'website-name';
        websiteName.textContent = website;
        
        const removeButton = document.createElement('button');
        removeButton.textContent = 'X';
        removeButton.className = 'remove-btn';
        removeButton.addEventListener('click', function () {
            console.log('Remove button clicked for:', website);
            removeWebsite(website, li);
        });

        li.appendChild(websiteName);
        li.appendChild(removeButton);
        websiteList.appendChild(li);
    }

    function removeWebsite(website, listItem) {
        console.log('Removing website:', website);
        chrome.storage.sync.get('websites', function (data) {
            const websites = data.websites || [];
            console.log('Current websites in storage:', websites);
            const index = websites.indexOf(website);
            if (index > -1) {
                websites.splice(index, 1);
                console.log('Updated websites list:', websites);
                chrome.storage.sync.set({ websites }, function () {
                    console.log('Website removed from storage, removing from DOM');
                    listItem.remove();
                    updateActiveTab();
                    
                    // Show empty state if no websites left
                    const remainingItems = websiteList.querySelectorAll('.website-item');
                    const emptyState = document.getElementById('emptyState');
                    if (remainingItems.length === 0 && emptyState) {
                        emptyState.style.display = 'block';
                    }
                    
                    // Force update all tabs immediately (only web pages)
                    console.log('Updating all tabs after website removal...');
                    chrome.tabs.query({url: ["http://*/*", "https://*/*"]}, function(tabs) {
                        console.log(`Found ${tabs.length} web tabs to update`);
                        tabs.forEach((tab, index) => {
                            console.log(`Updating tab ${index + 1}/${tabs.length}: ${tab.url}`);
                            chrome.tabs.sendMessage(tab.id, {action: "applyFilter"}, function(response) {
                                if (chrome.runtime.lastError) {
                                    console.log(`Could not connect to tab ${tab.id}: ${chrome.runtime.lastError.message}`);
                                } else {
                                    console.log(`Successfully updated tab: ${tab.url}`);
                                }
                            });
                        });
                    });
                });
            }
        });
    }

    function updateActiveTab() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && (tabs[0].url.startsWith('http://') || tabs[0].url.startsWith('https://'))) {
                chrome.tabs.sendMessage(tabs[0].id, {action: "applyFilter"}, function(response) {
                    if (chrome.runtime.lastError) {
                        console.log("Could not establish connection:", chrome.runtime.lastError.message);
                        // Don't reload tab automatically - just log the error
                    }
                });
            }
        });
    }

    // Tree Timer Functionality
    function startFocusSession() {
        console.log('startFocusSession called');
        
        // Check if already running
        if (timerInterval || stopTimer.classList.contains('hidden') === false) {
            console.log('Timer already running, ignoring');
            return;
        }

        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;
        
        if (minutes === 0 && seconds === 0) {
            timerStatus.textContent = 'Please set a timer duration!';
            timerStatus.className = 'status-message status-error';
            return;
        }

        console.log('Starting focus session:', minutes, 'minutes', seconds, 'seconds');

        timerDuration = (minutes * 60) + seconds;
        timerStartTime = Date.now();
        
        // Start tree growing animation
        if (treeLeaves) {
            treeLeaves.className = 'tree-leaves growing';
        }
        
        // Update UI
        if (startTimer) startTimer.classList.add('hidden');
        if (stopTimer) stopTimer.classList.remove('hidden');
        timerStatus.textContent = 'Your focus tree is growing! Stay away from blocked sites.';
        timerStatus.className = 'status-message status-active';
        
        // Save timer state
        chrome.storage.local.set({
            timerActive: true,
            timerStartTime: timerStartTime,
            timerDuration: timerDuration
        });

        // Start timer countdown
        startTimerCountdown();
        
        // Send message to ALL tabs to start blocking (not just active tab)
        chrome.tabs.query({url: ["http://*/*", "https://*/*"]}, function(tabs) {
            console.log(`Sending start timer message to ${tabs.length} tabs`);
            tabs.forEach((tab, index) => {
                chrome.tabs.sendMessage(tab.id, {
                    action: "startFocusTimer", 
                    duration: timerDuration,
                    startTime: timerStartTime
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.log(`Could not send start timer message to tab ${tab.id}: ${chrome.runtime.lastError.message}`);
                    } else {
                        console.log(`Start timer message sent successfully to tab ${index + 1}/${tabs.length}: ${tab.url}`);
                    }
                });
            });
        });
    }

    if (startTimer) {
        startTimer.addEventListener('click', startFocusSession);
    }
    
    // Make tree clickable to start focus session
    if (treeContainer) {
        treeContainer.addEventListener('click', function(e) {
            console.log('Tree clicked!');
            e.preventDefault();
            e.stopPropagation();
            startFocusSession();
        });
    }

    if (stopTimer) {
        stopTimer.addEventListener('click', function() {
            console.log('Give up button clicked!');
            giveUpTimer();
        });
    }

    function giveUpTimer() {
        // Update stats FIRST before any UI changes
        const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
        console.log('giveUpTimer called. timerStartTime:', timerStartTime, 'elapsed:', elapsed);
        console.log('About to call updateStats with killed and elapsed time:', elapsed);
        
        // Immediate stats update - use synchronous approach
        chrome.storage.local.get(['totalProductiveTime', 'treesGrownCount', 'treesKilledCount'], function(data) {
            let totalTime = data.totalProductiveTime || 0;
            let grown = data.treesGrownCount || 0;
            let killed = data.treesKilledCount || 0;

            // Update stats
            killed += 1;
            totalTime += elapsed;

            console.log('Updating stats immediately:', { totalTime, grown, killed });

            chrome.storage.local.set({
                totalProductiveTime: totalTime,
                treesGrownCount: grown,
                treesKilledCount: killed
            }, function() {
                console.log('Stats saved successfully - killed:', killed);
                
                // Force immediate UI update
                setTimeout(() => {
                    if (treesKilled) {
                        treesKilled.textContent = killed.toString();
                        console.log('Trees killed UI updated to:', killed);
                    }
                    if (totalHours) {
                        const hours = Math.floor(totalTime / 3600);
                        const minutes = Math.floor((totalTime % 3600) / 60);
                        if (hours > 0) {
                            totalHours.textContent = `${hours}h ${minutes}m`;
                        } else if (minutes > 0) {
                            totalHours.textContent = `${minutes}m`;
                        } else {
                            totalHours.textContent = '0m';
                        }
                        console.log('Total hours UI updated to:', totalHours.textContent);
                    }
                    console.log('Stats UI updated immediately');
                }, 0);
            });
        });
        
        // Kill the tree animation
        treeLeaves.className = 'tree-leaves dying';
        
        // Stop timer
        stopTimerCountdown();
        
        // Update UI
        startTimer.classList.remove('hidden');
        stopTimer.classList.add('hidden');
        timerStatus.textContent = 'You gave up! Your tree has died. Watch the death animation...';
        timerStatus.className = 'status-message status-error';
        timerDisplay.textContent = '00:00';
        
        // Clear timer state
        chrome.storage.local.remove(['timerActive', 'timerStartTime', 'timerDuration']);
        
        // Send message to ALL tabs to stop blocking (not just active tab)
        chrome.tabs.query({url: ["http://*/*", "https://*/*"]}, function(tabs) {
            console.log(`Sending stop timer message to ${tabs.length} tabs`);
            tabs.forEach((tab, index) => {
                chrome.tabs.sendMessage(tab.id, {action: "stopFocusTimer"}, function(response) {
                    if (chrome.runtime.lastError) {
                        console.log(`Could not send stop timer message to tab ${tab.id}: ${chrome.runtime.lastError.message}`);
                    } else {
                        console.log(`Stop timer message sent successfully to tab ${index + 1}/${tabs.length}: ${tab.url}`);
                    }
                });
            });
        });

        // Reset tree after death animation completes (2s animation)
        setTimeout(() => {
            treeLeaves.className = 'tree-leaves';
            timerStatus.textContent = 'Your tree has died. Set a timer to grow a new one.';
            timerStatus.className = 'status-message status-default';
        }, 2500);
    }

    function startTimerCountdown() {
        timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
            const remaining = Math.max(0, timerDuration - elapsed);
            
            if (remaining <= 0) {
                // Timer completed!
                completeTimer();
                return;
            }
            
            updateTimerDisplay(remaining);
        }, 1000);
    }

    function stopTimerCountdown() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function completeTimer() {
        stopTimerCountdown();
        
        // Update stats FIRST - tree grown successfully
        console.log('completeTimer called. timerDuration:', timerDuration);
        
        // Immediate stats update
        chrome.storage.local.get(['totalProductiveTime', 'treesGrownCount', 'treesKilledCount'], function(data) {
            let totalTime = data.totalProductiveTime || 0;
            let grown = data.treesGrownCount || 0;
            let killed = data.treesKilledCount || 0;

            // Update stats
            grown += 1;
            totalTime += timerDuration;

            console.log('Updating stats immediately:', { totalTime, grown, killed });

            chrome.storage.local.set({
                totalProductiveTime: totalTime,
                treesGrownCount: grown,
                treesKilledCount: killed
            }, function() {
                console.log('Stats saved successfully - grown:', grown);
                
                // Update UI immediately
                if (treesGrown) {
                    treesGrown.textContent = grown.toString();
                }
                if (totalHours) {
                    const hours = Math.floor(totalTime / 3600);
                    const minutes = Math.floor((totalTime % 3600) / 60);
                    if (hours > 0) {
                        totalHours.textContent = `${hours}h ${minutes}m`;
                    } else if (minutes > 0) {
                        totalHours.textContent = `${minutes}m`;
                    } else {
                        totalHours.textContent = '0m';
                    }
                }
                
                console.log('Stats UI updated immediately');
            });
        });
        
        // Tree fully grown!
        timerStatus.textContent = 'Congratulations! Your focus tree has grown successfully! 🌳';
        timerStatus.className = 'status-message status-success';
        timerDisplay.textContent = '00:00';
        
        // Update UI
        startTimer.classList.remove('hidden');
        stopTimer.classList.add('hidden');
        
        // Clear timer state
        chrome.storage.local.remove(['timerActive', 'timerStartTime', 'timerDuration']);
        
        // Send message to ALL tabs to stop timer
        chrome.tabs.query({url: ["http://*/*", "https://*/*"]}, function(tabs) {
            console.log(`Sending stop timer message to ${tabs.length} tabs (timer completed)`);
            tabs.forEach((tab, index) => {
                chrome.tabs.sendMessage(tab.id, {action: "stopFocusTimer"}, function(response) {
                    if (chrome.runtime.lastError) {
                        console.log(`Could not send stop timer message to tab ${tab.id}: ${chrome.runtime.lastError.message}`);
                    } else {
                        console.log(`Stop timer message sent successfully to tab ${index + 1}/${tabs.length}: ${tab.url}`);
                    }
                });
            });
        });

        // Reset tree after a moment
        setTimeout(() => {
            treeLeaves.className = 'tree-leaves';
            timerStatus.textContent = 'Set a timer and watch your focus tree grow!';
            timerStatus.className = 'status-message status-default';
        }, 3000);
    }

    function updateTimerDisplay(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }



    // Handle UI updates when user gives up from overlay (stats already updated by background script)
    function giveUpTimerUIOnly() {
        // Kill the tree animation
        treeLeaves.className = 'tree-leaves dying';
        
        // Stop timer
        stopTimerCountdown();
        
        // Update UI
        startTimer.classList.remove('hidden');
        stopTimer.classList.add('hidden');
        timerStatus.textContent = 'You gave up! Your tree has died. Watch the death animation...';
        timerStatus.className = 'status-message status-error';
        timerDisplay.textContent = '00:00';
        
        // Clear timer state
        chrome.storage.local.remove(['timerActive', 'timerStartTime', 'timerDuration']);
        
        // Send message to ALL tabs to stop blocking (not just active tab)
        chrome.tabs.query({url: ["http://*/*", "https://*/*"]}, function(tabs) {
            console.log(`Sending stop timer message to ${tabs.length} tabs`);
            tabs.forEach((tab, index) => {
                chrome.tabs.sendMessage(tab.id, {action: "stopFocusTimer"}, function(response) {
                    if (chrome.runtime.lastError) {
                        console.log(`Could not send stop timer message to tab ${tab.id}: ${chrome.runtime.lastError.message}`);
                    } else {
                        console.log(`Stop timer message sent successfully to tab ${index + 1}/${tabs.length}: ${tab.url}`);
                    }
                });
            });
        });

        // Reset tree after death animation completes (2s animation)
        setTimeout(() => {
            treeLeaves.className = 'tree-leaves';
            timerStatus.textContent = 'Your tree has died. Set a timer to grow a new one.';
            timerStatus.className = 'status-message status-default';
        }, 2500);
    }

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "focusGiveUp") {
            // User gave up from overlay - stats already updated by background script, just update UI
            console.log('Popup received focusGiveUp message from background script');
            giveUpTimerUIOnly();
        }
    });

    // Add a test function to the global scope for debugging
    window.testStats = function() {
        console.log('Testing stats system...');
        updateStats('killed', 30); // Test killing a tree with 30 seconds
        setTimeout(() => {
            updateStats('grown', 120); // Test growing a tree with 2 minutes
        }, 2000);
    };

    window.resetStats = function() {
        console.log('Resetting all stats...');
        chrome.storage.local.set({
            totalProductiveTime: 0,
            treesGrownCount: 0,
            treesKilledCount: 0
        }, function() {
            console.log('Stats reset complete');
            setTimeout(() => {
                loadStats();
            }, 100);
        });
    };

    window.forceStatsUpdate = function() {
        console.log('Force updating stats display...');
        loadStats();
    };

    window.testGiveUp = function() {
        console.log('Testing give up functionality...');
        if (timerStartTime) {
            giveUpTimer();
        } else {
            console.log('No timer is running. Starting a fake timer for testing...');
            timerStartTime = Date.now() - 30000; // 30 seconds ago
            giveUpTimer();
        }
    };
});