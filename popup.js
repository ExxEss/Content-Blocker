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
                    sendMessageToContentScript('blockContentWithNewKeyword', keyword);
                });
            }
        });
    }
});

const sendMessageToContentScript = (action, data) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        for (let tab of tabs) {
            chrome.tabs.sendMessage(tab.id, { action, data });
        }
    });
};

function saveKeyword() {
    const keyword = document.getElementById('keywordInput').value.trim();
    if (keyword) {
        chrome.storage.local.get({ keywords: [] }, function (data) {
            let keywords = data.keywords;
            if (!keywords.includes(keyword)) {
                keywords.unshift(keyword);
                chrome.storage.local.set({ keywords: keywords }, function () {
                    document.getElementById('keywordInput').value = '';
                    updateKeywordList();
                });
            }
        });
    }
}

function deleteKeyword(keyword) {
    chrome.storage.local.get({ keywords: [] }, function (data) {
        let keywords = data.keywords.filter(k => k !== keyword);
        chrome.storage.local.set({ keywords: keywords },
            function () {
                updateKeywordList();
                sendMessageToContentScript('unblockContentWithNewKeyword', keyword);
            }
        );
    });
}

function updateKeywordList() {
    const listElement = document.getElementById('keywordList');
    const toggleKeywordBtn = document.getElementById('toggleKeywordBtn'); // Ensure this ID matches your button

    listElement.innerHTML = ''; // Clear current list

    chrome.storage.local.get({ keywords: [] }, function (data) {
        const keywordCount = data.keywords.length; // Get the count of keywords

        // Hide the toggle button if there are no keywords, else update text and show it
        if (keywordCount > 0) {
            toggleKeywordBtn.textContent = `Hide blocked (${keywordCount})`;
            toggleKeywordBtn.style.display = ''; // Make sure the button is visible
        } else {
            toggleKeywordBtn.style.display = 'none'; // Hide the button if no keywords are blocked
        }

        data.keywords.forEach(keyword => {
            let li = document.createElement('li');
            li.textContent = keyword + " "; // Add a space before the delete button for separation

            let deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn'; // Apply CSS styles for the "X"
            deleteBtn.onclick = function () { 
                deleteKeyword(keyword); 
            };

            li.appendChild(deleteBtn);
            listElement.appendChild(li);
        });
    });
}

document.getElementById('saveBtn').addEventListener('click', saveKeyword);

document.addEventListener('DOMContentLoaded', function () {
    // Load the initial blocker status and update the button text
    chrome.storage.local.get({ blockerEnabled: true }, function (data) {
        const toogleBlockerBtn = document.getElementById('toogleBlockerBtn');
        toogleBlockerBtn.textContent = data.blockerEnabled ? 'Disable Blocker' : 'Enable Blocker';
    });

    // Existing functionality to update keywords list and save a keyword
    updateKeywordList();

    document.getElementById('toggleKeywordBtn').addEventListener('click', function () {
        const keywordList = document.getElementById('keywordList');
        // Check the current display state of the keyword list
        if (keywordList.style.display === 'none' || keywordList.style.display === '') {
            keywordList.style.display = 'block'; // Show the keyword list
            // Update the button text to reflect the action that will be taken if clicked again
            this.textContent = `Hide blocked (${keywordList.querySelectorAll('li').length})`;
        } else {
            keywordList.style.display = 'none'; // Hide the keyword list
            // Since the button might be hidden if there are no keywords, ensure it only updates when visible
            if (this.style.display !== 'none') {
                this.textContent = `Show blocked (${keywordList.querySelectorAll('li').length})`;
            }
        }
    });
    

    // Enable/Disable the blocker functionality
    document.getElementById('toogleBlockerBtn').addEventListener('click', function () {
        chrome.storage.local.get({ blockerEnabled: true },
            function (data) {
                const newState = !data.blockerEnabled;
                chrome.storage.local.set({ blockerEnabled: newState },
                    function () {
                        document.getElementById('toogleBlockerBtn').textContent = newState
                            ? 'Disable Blocker'
                            : 'Enable Blocker';

                        action = newState ? 'blockContent' : 'unblockContent';
                        sendMessageToContentScript(action);
                    });
            });
    });
});


