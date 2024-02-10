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
                    sendMessageToContentScript('refreshKeywords');
                });
            }
        });
    }
});

const sendMessageToContentScript = (action, data) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action, data });
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
        chrome.storage.local.set({ keywords: keywords }, updateKeywordList);
    });
}

function updateKeywordList() {
    const listElement = document.getElementById('keywordList');
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
        const toogleBlockerBtn = document.getElementById('toogleBlockerBtn');
        toogleBlockerBtn.textContent = data.blockerEnabled ? 'Disable Blocker' : 'Enable Blocker';
    });

    // Existing functionality to update keywords list and save a keyword
    updateKeywordList();

    const toggleKeywordBtn = document.getElementById('toggleKeywordBtn');
    const keywordList = document.getElementById('keywordList');

    // Toggle visibility of blocked keywords list
    toggleKeywordBtn.addEventListener('click', function () {
        if (keywordList.style.display === 'none' || keywordList.style.display === '') {
            keywordList.style.display = 'block';
            toggleKeywordBtn.textContent = 'Hide blocked';
        } else {
            keywordList.style.display = 'none';
            toggleKeywordBtn.textContent = 'Show blocked';
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
                        
                        if (newState) {
                            sendMessageToContentScript('blockContent');
                        }
                    });
            });
    });
});


