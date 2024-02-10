document.getElementById('saveBtn').addEventListener('click', function () {
    const keyword = document.getElementById('keywordInput').value;
    if (keyword) {
        // Retrieve existing keywords array from localStorage, or initialize it if it doesn't exist
        chrome.storage.local.get({ keywords: [] }, function (data) {
            let keywords = data.keywords;
            if (!keywords.includes(keyword)) {
                keywords.push(keyword);
                // Save the updated keywords array back to localStorage
                chrome.storage.local.set({ keywords: keywords }, function () {
                    document.getElementById('keywordInput').value = '';
                    // Optionally, send a message to content.js to refresh the keywords
                    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, { action: "refreshKeywords" });
                    });
                });
            }
        });
    }
});

function saveKeyword() {
    const keyword = document.getElementById('keywordInput').value.trim();
    if (keyword) {
        chrome.storage.local.get({ keywords: [] }, function (data) {
            let keywords = data.keywords;
            if (!keywords.includes(keyword)) {
                keywords.unshift(keyword);
                chrome.storage.local.set({ keywords: keywords }, function () {
                    document.getElementById('keywordInput').value = '';
                    updateKeywordsList();
                });
            }
        });
    }
}

function deleteKeyword(keyword) {
    chrome.storage.local.get({ keywords: [] }, function (data) {
        let keywords = data.keywords.filter(k => k !== keyword);
        chrome.storage.local.set({ keywords: keywords }, updateKeywordsList);
    });
}

function updateKeywordsList() {
    const listElement = document.getElementById('keywordsList');
    listElement.innerHTML = ''; // Clear current list

    chrome.storage.local.get({ keywords: [] }, function (data) {
        data.keywords.forEach(keyword => {
            let li = document.createElement('li');
            li.textContent = keyword + " "; // Add a space before the button for separation

            let deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn'; // Apply CSS styles for the "X"
            deleteBtn.onclick = function () { deleteKeyword(keyword); };

            li.appendChild(deleteBtn);
            listElement.appendChild(li);
        });
    });
}

document.getElementById('saveBtn').addEventListener('click', saveKeyword);

document.addEventListener('DOMContentLoaded', function () {
    // Load the initial blocker status and update the button text
    chrome.storage.local.get({ blockerEnabled: true }, function (data) {
        const enableDisableBtn = document.getElementById('enableDisableBtn');
        enableDisableBtn.textContent = data.blockerEnabled ? 'Disable Blocker' : 'Enable Blocker';
    });

    // Existing functionality to update keywords list and save a keyword
    updateKeywordsList();

    const toggleBtn = document.getElementById('toggleBtn');
    const keywordsList = document.getElementById('keywordsList');

    // Toggle visibility of blocked keywords list
    toggleBtn.addEventListener('click', function () {
        if (keywordsList.style.display === 'none' || keywordsList.style.display === '') {
            keywordsList.style.display = 'block';
            toggleBtn.textContent = 'Hide blocked';
        } else {
            keywordsList.style.display = 'none';
            toggleBtn.textContent = 'Show blocked';
        }
    });

    // Enable/Disable the blocker functionality
    document.getElementById('enableDisableBtn').addEventListener('click', function () {
        chrome.storage.local.get({ blockerEnabled: true }, function (data) {
            const newState = !data.blockerEnabled;
            chrome.storage.local.set({ blockerEnabled: newState }, function () {
                document.getElementById('enableDisableBtn').textContent = newState ? 'Disable Blocker' : 'Enable Blocker';
                // Optionally, send a message to content.js to act on this state change
                // This requires message handling in content.js to listen for this message
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "toggleBlockerState", state: newState });
                });
            });
        });
    });
});


