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

document.addEventListener('DOMContentLoaded', function() {
    // Existing functionality to update keywords list and save a keyword
    updateKeywordsList();
    
    const toggleBtn = document.getElementById('toggleBtn');
    const keywordsList = document.getElementById('keywordsList');
    
    toggleBtn.addEventListener('click', function() {
        // Check if keywordsList is not visible either because it's "none" or hasn't been set (empty string)
        if (keywordsList.style.display === 'none' || keywordsList.style.display === '') {
            keywordsList.style.display = 'block';
            toggleBtn.textContent = 'Hide blocked';
        } else {
            keywordsList.style.display = 'none';
            toggleBtn.textContent = 'Show blocked';
        }
    });
});


