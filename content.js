// Only run on web pages, not on chrome:// or extension pages
if (!window.location.href.startsWith('http://') && !window.location.href.startsWith('https://')) {
    console.log('Focus Tree: Skipping execution on non-web page:', window.location.href);
    // Exit early, don't run any extension logic
} else {

try {
    let filterApplied = false;
    let focusTimerActive = false;
    let focusStartTime = null;
    let focusDuration = 0;
    let timerOverlay = null;
    let timerInterval = null;

    function applyFilter() {
        setTimeout(() => {
            chrome.storage.sync.get('websites', function(data) {
                if (chrome.runtime.lastError) {
                    console.error("Error accessing storage:", chrome.runtime.lastError);
                    return;
                }
                const websites = data.websites || [];
                const currentUrl = window.location.href;
                console.log("Current URL:", currentUrl);
                console.log("Websites list:", websites);

                if (shouldApplyFilter(currentUrl, websites)) {
                    console.log("Applying filter");
                    if (!filterApplied) {
                        addFilterStyles();
                        filterApplied = true;
                    }
                    
                    // Check if focus timer is active and show overlay
                    if (focusTimerActive) {
                        showTimerOverlay();
                    }
                } else {
                    console.log("Removing filter");
                    removeFilter();
                    hideTimerOverlay();
                }
            });
        }, 500); // 500ms delay
    }

    function shouldApplyFilter(url, websiteList) {
        const currentHostname = new URL(url).hostname.replace(/^www\./, '');
        return websiteList.some(site => {
            const siteHostname = site.replace(/^www\./, '');
            return currentHostname === siteHostname || currentHostname.endsWith(`.${siteHostname}`);
        });
    }

    function addFilterStyles() {
        const style = document.createElement('style');
        style.id = 'grayscale-filter-style';
        style.textContent = `
            html {
                filter: grayscale(100%) !important;
                -webkit-filter: grayscale(100%) !important;
            }
        `;
        document.head.appendChild(style);
    }

    function removeFilter() {
        if (filterApplied) {
            const style = document.getElementById('grayscale-filter-style');
            if (style) {
                style.remove();
            }
            filterApplied = false;
        }
    }

    function showTimerOverlay() {
        if (timerOverlay) return; // Already showing

        timerOverlay = document.createElement('div');
        timerOverlay.id = 'focus-timer-overlay';
        timerOverlay.innerHTML = `
            <div class="overlay-content">
                <div class="overlay-card">
                    <div class="tree-container">
                        <div class="tree-scene">
                            <div class="tree-base"></div>
                            <div class="tree-trunk"></div>
                            <div class="tree-leaves growing">
                                <div class="tree-layer tree-layer-1"></div>
                                <div class="tree-layer tree-layer-2"></div>
                                <div class="tree-layer tree-layer-3"></div>
                            </div>
                                                         <div class="floating-leaves">
                                 <div class="leaf leaf-1"></div>
                                 <div class="leaf leaf-2"></div>
                                 <div class="leaf leaf-3"></div>
                                 <div class="leaf leaf-4"></div>
                                 <div class="leaf leaf-5"></div>
                             </div>
                        </div>
                    </div>
                    <div class="timer-display" id="overlayTimer">--:--</div>
                    <div class="timer-message">
                        <h3>🌱 Your Focus Tree is Growing!</h3>
                        <p>Stay focused! Don't let your tree die.</p>
                    </div>
                    <button class="give-up-btn" id="giveUpBtn">Give Up & Kill Tree</button>
                </div>
            </div>
        `;

        // Add styles for the overlay
        const style = document.createElement('style');
        style.textContent = `
            #focus-timer-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(8px);
                z-index: 999999;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
                animation: overlayFadeIn 0.3s ease-out;
            }

            @keyframes overlayFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .overlay-content {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                height: 100%;
                padding: 20px;
            }

            .overlay-card {
                background: white;
                border-radius: 16px;
                padding: 48px 32px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                max-width: 450px;
                width: 100%;
                text-align: center;
                border: 1px solid #e4e4e7;
                animation: cardSlideIn 0.4s ease-out;
            }

            @keyframes cardSlideIn {
                from { 
                    opacity: 0; 
                    transform: translateY(20px) scale(0.95); 
                }
                to { 
                    opacity: 1; 
                    transform: translateY(0) scale(1); 
                }
            }

            /* 3D Tree Styles for Overlay */
            .tree-container {
                perspective: 1000px;
                margin: 32px 0;
                display: flex;
                justify-content: center;
            }

            .tree-scene {
                width: 280px;
                height: 280px;
                position: relative;
                transform-style: preserve-3d;
                transition: transform 0.3s ease;
            }

            .tree-scene:hover {
                transform: rotateX(5deg) rotateY(10deg);
            }

            .tree-base {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                width: 200px;
                height: 20px;
                background: linear-gradient(45deg, #8b7355, #a0845c);
                border-radius: 50%;
                box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            }

            .tree-trunk {
                position: absolute;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                width: 24px;
                height: 80px;
                background: linear-gradient(to right, #8B4513, #A0522D, #8B4513);
                border-radius: 12px 12px 4px 4px;
                box-shadow: 
                    inset -4px 0 8px rgba(0,0,0,0.3),
                    2px 0 10px rgba(0,0,0,0.2);
                transform-style: preserve-3d;
            }

            .tree-trunk::before {
                content: '';
                position: absolute;
                top: 20px;
                left: -3px;
                width: 8px;
                height: 15px;
                background: #654321;
                border-radius: 4px;
                transform: rotateZ(-30deg);
            }

            .tree-trunk::after {
                content: '';
                position: absolute;
                top: 35px;
                right: -3px;
                width: 6px;
                height: 12px;
                background: #654321;
                border-radius: 3px;
                transform: rotateZ(25deg);
            }

            .tree-leaves {
                position: absolute;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%);
                transform-style: preserve-3d;
                transition: all 0.5s ease;
            }

            .tree-layer {
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                transform-style: preserve-3d;
            }

            .tree-layer-1 {
                width: 0;
                height: 0;
                border-left: 50px solid transparent;
                border-right: 50px solid transparent;
                border-bottom: 60px solid #228B22;
                opacity: 1;
                filter: drop-shadow(0 5px 10px rgba(0,0,0,0.3));
                animation: leafSway 3s ease-in-out infinite, pulse 2s ease-in-out infinite;
            }

            .tree-layer-2 {
                width: 0;
                height: 0;
                border-left: 35px solid transparent;
                border-right: 35px solid transparent;
                border-bottom: 45px solid #32CD32;
                bottom: 20px;
                opacity: 1;
                filter: drop-shadow(0 5px 10px rgba(0,0,0,0.2));
                animation: leafSway 3s ease-in-out infinite 0.5s, pulse 2s ease-in-out infinite 0.3s;
            }

            .tree-layer-3 {
                width: 0;
                height: 0;
                border-left: 25px solid transparent;
                border-right: 25px solid transparent;
                border-bottom: 30px solid #90EE90;
                bottom: 40px;
                opacity: 1;
                filter: drop-shadow(0 5px 10px rgba(0,0,0,0.15));
                animation: leafSway 3s ease-in-out infinite 1s, pulse 2s ease-in-out infinite 0.6s;
            }

            .tree-leaves.dying .tree-layer-1,
            .tree-leaves.dying .tree-layer-2,
            .tree-leaves.dying .tree-layer-3 {
                animation: treeDie 1.5s ease-in forwards;
            }

            @keyframes leafSway {
                0%, 100% {
                    transform: translateX(-50%) rotateZ(0deg);
                }
                25% {
                    transform: translateX(-50%) rotateZ(2deg);
                }
                75% {
                    transform: translateX(-50%) rotateZ(-2deg);
                }
            }

            @keyframes pulse {
                0%, 100% { 
                    transform: translateX(-50%) scale(1); 
                }
                50% { 
                    transform: translateX(-50%) scale(1.05); 
                }
            }

            @keyframes treeDie {
                0% {
                    opacity: 1;
                    filter: drop-shadow(0 5px 10px rgba(0,0,0,0.3)) hue-rotate(0deg);
                    transform: translateX(-50%) scale(1) rotateX(0deg);
                }
                30% {
                    filter: drop-shadow(0 5px 10px rgba(0,0,0,0.3)) hue-rotate(30deg);
                    transform: translateX(-50%) scale(0.9) rotateX(10deg);
                }
                60% {
                    filter: drop-shadow(0 5px 10px rgba(0,0,0,0.3)) hue-rotate(60deg) saturate(0.5);
                    transform: translateX(-50%) scale(0.7) rotateX(20deg);
                }
                100% {
                    opacity: 0;
                    filter: drop-shadow(0 0 0 rgba(0,0,0,0)) hue-rotate(90deg) saturate(0);
                    transform: translateX(-50%) scale(0) rotateX(90deg) rotateY(180deg);
                }
            }

            .floating-leaves {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                overflow: hidden;
            }

            .leaf {
                position: absolute;
                width: 8px;
                height: 8px;
                background: #32CD32;
                border-radius: 50% 0;
                opacity: 0;
                transform: rotate(45deg);
                animation: leafFloat 3s ease-in-out infinite;
            }

            @keyframes leafFloat {
                0% {
                    opacity: 0;
                    transform: translateY(0) rotate(45deg) scale(0);
                }
                10% {
                    opacity: 1;
                    transform: translateY(-20px) rotate(135deg) scale(1);
                }
                90% {
                    opacity: 1;
                    transform: translateY(-100px) rotate(405deg) scale(0.8);
                }
                100% {
                    opacity: 0;
                    transform: translateY(-120px) rotate(495deg) scale(0);
                }
            }

            .timer-display {
                font-size: 56px;
                font-weight: 700;
                margin: 32px 0 24px 0;
                color: #09090b;
                font-variant-numeric: tabular-nums;
                letter-spacing: -0.02em;
            }

            .timer-message h3 {
                margin: 0 0 12px 0;
                font-size: 24px;
                font-weight: 600;
                color: #09090b;
                letter-spacing: -0.025em;
            }

            .timer-message p {
                margin: 0 0 32px 0;
                font-size: 16px;
                color: #71717a;
                line-height: 1.5;
            }

            .give-up-btn {
                background: #ef4444;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                outline: none;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .give-up-btn:hover {
                background: #dc2626;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgb(239 68 68 / 0.3);
            }

            .leaf-1 {
                left: 45%;
                animation-delay: 0s;
            }

            .leaf-2 {
                left: 55%;
                animation-delay: 0.5s;
            }

            .leaf-3 {
                left: 40%;
                animation-delay: 1s;
            }

            .leaf-4 {
                left: 60%;
                animation-delay: 1.5s;
            }

            .leaf-5 {
                left: 50%;
                animation-delay: 2s;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(timerOverlay);

        // Add event listener for give up button
        document.getElementById('giveUpBtn').addEventListener('click', function() {
            giveUpFocus();
        });

        // Start updating the timer display
        updateOverlayTimer();
        timerInterval = setInterval(updateOverlayTimer, 1000);
    }

    function hideTimerOverlay() {
        if (timerOverlay) {
            timerOverlay.remove();
            timerOverlay = null;
        }
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function updateOverlayTimer() {
        if (!focusTimerActive || !timerOverlay) return;

        const elapsed = Math.floor((Date.now() - focusStartTime) / 1000);
        const remaining = Math.max(0, focusDuration - elapsed);
        
        if (remaining <= 0) {
            // Timer completed
            hideTimerOverlay();
            return;
        }

        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        const timerDisplay = document.getElementById('overlayTimer');
        if (timerDisplay) {
            timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }

    function giveUpFocus() {
        // Show tree dying animation
        const treeLeaves = timerOverlay.querySelector('.tree-leaves');
        if (treeLeaves) {
            treeLeaves.className = 'tree-leaves dying';
        }

        // Update message
        const message = timerOverlay.querySelector('.timer-message');
        if (message) {
            message.innerHTML = `
                <h3>💀 Tree Killed!</h3>
                <p>You gave up. Your focus tree has died.</p>
            `;
        }

        // Hide give up button
        const giveUpBtn = document.getElementById('giveUpBtn');
        if (giveUpBtn) {
            giveUpBtn.style.visibility = 'hidden';
        }

        // Send message to popup to update state
        chrome.runtime.sendMessage({action: "focusGiveUp"});

        // Hide overlay after animation
        setTimeout(() => {
            hideTimerOverlay();
            focusTimerActive = false;
        }, 1500);
    }

    // Apply filter when the page loads
    applyFilter();

    // Listen for changes in the websites list
    chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (changes.websites) {
            applyFilter();
        }
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        console.log("Content script message received:", request);
        
        if (request.action === "applyFilter") {
            console.log("Applying filter due to message from popup");
            applyFilter();
            sendResponse({success: true, message: "Filter applied"});
        } else if (request.action === "startFocusTimer") {
            console.log("Starting focus timer from popup");
            focusTimerActive = true;
            focusStartTime = request.startTime;
            focusDuration = request.duration;
            
            // Force immediate check - apply filter without delay to ensure overlay shows
            console.log("Forcing immediate filter application...");
            chrome.storage.sync.get('websites', function(data) {
                if (chrome.runtime.lastError) {
                    console.error("Error accessing storage:", chrome.runtime.lastError);
                    return;
                }
                const websites = data.websites || [];
                const currentUrl = window.location.href;
                console.log("Current URL during timer start:", currentUrl);
                console.log("Websites list during timer start:", websites);

                if (shouldApplyFilter(currentUrl, websites)) {
                    console.log("This page should show timer overlay - applying filter and showing overlay");
                    if (!filterApplied) {
                        addFilterStyles();
                        filterApplied = true;
                    }
                    
                    // Force show overlay
                    showTimerOverlay();
                } else {
                    console.log("This page is not blocked, no overlay needed");
                }
            });
            
            sendResponse({success: true, message: "Focus timer started"});
        } else if (request.action === "stopFocusTimer") {
            console.log("Stopping focus timer from popup");
            focusTimerActive = false;
            hideTimerOverlay();
            sendResponse({success: true, message: "Focus timer stopped"});
        }
        
        return true;
    });

    // Load focus timer state on page load
    chrome.storage.local.get(['timerActive', 'timerStartTime', 'timerDuration'], function(data) {
        if (data.timerActive && data.timerStartTime && data.timerDuration) {
            const elapsed = Math.floor((Date.now() - data.timerStartTime) / 1000);
            const remaining = Math.max(0, data.timerDuration - elapsed);
            
            if (remaining > 0) {
                focusTimerActive = true;
                focusStartTime = data.timerStartTime;
                focusDuration = data.timerDuration;
                applyFilter();
            }
        }
    });

    // Reapply filter on page changes without full reload
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            applyFilter();
        }
    }).observe(document, {subtree: true, childList: true});

    // Ensure the filter is applied after DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM fully loaded and parsed");
        applyFilter();
    });

} catch (error) {
    console.error("An error occurred in the Focus Tree extension:", error);
}
}