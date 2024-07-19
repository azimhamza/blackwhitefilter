document.addEventListener('DOMContentLoaded', function () {
    const websiteInput = document.getElementById('website');
    const addButton = document.getElementById('addButton');
    const websiteList = document.getElementById('websiteList');

    // Load websites from storage and display them
    chrome.storage.sync.get('websites', function (data) {
        const websites = data.websites || [];
        websites.forEach(addWebsiteToList);
    });

    // Add website to storage and list when button is clicked
    addButton.addEventListener('click', function () {
        let website = websiteInput.value.trim();
        if (website) {
            // Remove http://, https://, www., and trailing slashes
            website = website.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/+$/, '');
            chrome.storage.sync.get('websites', function (data) {
                const websites = data.websites || [];
                if (!websites.includes(website)) {
                    websites.push(website);
                    chrome.storage.sync.set({ websites }, function () {
                        addWebsiteToList(website);
                        websiteInput.value = '';
                        updateActiveTab();
                    });
                }
            });
        }
    });

    // Add website to the displayed list with a remove button
    function addWebsiteToList(website) {
        const li = document.createElement('li');
        li.textContent = website;

        const removeButton = document.createElement('button');
        removeButton.textContent = 'x';
        removeButton.className = 'remove';
        removeButton.addEventListener('click', function () {
            removeWebsite(website, li);
        });

        li.appendChild(removeButton);
        websiteList.appendChild(li);
    }

    // Remove website from storage and list
    function removeWebsite(website, listItem) {
        chrome.storage.sync.get('websites', function (data) {
            const websites = data.websites || [];
            const index = websites.indexOf(website);
            if (index > -1) {
                websites.splice(index, 1);
                chrome.storage.sync.set({ websites }, function () {
                    listItem.remove();
                    updateActiveTab();
                });
            }
        });
    }

    // Update the active tab
    function updateActiveTab() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {action: "applyFilter"}, function(response) {
                    if (chrome.runtime.lastError) {
                        console.log("Could not establish connection. Reloading tab.");
                        chrome.tabs.reload(tabs[0].id);
                    }
                });
            }
        });
    }
});