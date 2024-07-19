let filterApplied = false;

function applyFilter() {
    chrome.storage.sync.get('websites', function(data) {
        const websites = data.websites || [];
        const currentHostname = window.location.hostname.replace(/^www\./, '');
        console.log("Current hostname:", currentHostname);
        console.log("Websites list:", websites);

        if (websites.some(site => currentHostname.includes(site))) {
            console.log("Applying filter");
            if (!filterApplied) {
                addFilterStyles();
                filterApplied = true;
            }
        } else {
            console.log("Removing filter");
            removeFilter();
        }
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

// Apply filter when the page loads
applyFilter();

// Listen for changes in the websites list
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.websites) {
        applyFilter();
    }
});

// Listen for tab updates
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("Message received:", request);
    if (request.action === "applyFilter") {
        applyFilter();
    }
    return true; // This line is important for asynchronous response
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