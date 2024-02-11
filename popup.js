// Helper functions
function getKeyword() {
    return document.getElementById('keywordInput').value.trim();
}

function clearInputField() {
    document.getElementById('keywordInput').value = '';
}

function toggleButtonVisibility(keywordCount) {
    const toggleKeywordBtn = document.getElementById('toggleKeywordBtn');
    toggleKeywordBtn.style.display = keywordCount > 0 ? '' : 'none';
    toggleKeywordBtn.textContent = `Show blocked (${keywordCount})`;
}

function updateKeywordsUI(keywords) {
    updateKeywordList(keywords);
    toggleButtonVisibility(keywords.length);
}

// CRUD operations
function addKeyword(keyword) {
    chrome.storage.local.get({ keywords: [] }, function (data) {
        let keywords = data.keywords;
        if (!keywords.includes(keyword)) {
            keywords.unshift(keyword);
            chrome.storage.local.set({ keywords }, function () {
                clearInputField();
                updateKeywordsUI(keywords);
                sendMessageToContentScript('blockContentWithNewKeyword', keyword);
            });
        }
    });
}

function removeKeyword(keyword) {
    chrome.storage.local.get({ keywords: [] }, function (data) {
        let keywords = data.keywords.filter(k => k !== keyword);
        chrome.storage.local.set({ keywords }, function () {
            updateKeywordsUI(keywords);
            sendMessageToContentScript('unblockContentWithNewKeyword', keyword);
        });
    });
}

// Update UI
function updateKeywordList(keywords) {
    const keywordList = document.getElementById('keywordList');
    keywordList.innerHTML = '';
    keywords.forEach(keyword => {
        let li = document.createElement('li');
        li.textContent = keyword + " ";

        let deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => removeKeyword(keyword);

        li.appendChild(deleteBtn);
        keywordList.appendChild(li);
    });
}

// Messaging
const sendMessageToContentScript = (action, data) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { action, data }));
    });
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get({ keywords: [], blockerEnabled: true }, function (data) {
        updateKeywordsUI(data.keywords);
        const toogleBlockerBtn = document.getElementById('toogleBlockerBtn');
        toogleBlockerBtn.textContent = data.blockerEnabled ? 'Disable Blocker' : 'Enable Blocker';
    });

    document.getElementById('keywordInput').focus();

    document.getElementById('keywordInput').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            addKeyword(getKeyword());
        }
    });

    document.getElementById('toggleKeywordBtn').addEventListener('click', function () {
        const keywordList = document.getElementById('keywordList');
        const isVisible = window.getComputedStyle(keywordList).display !== 'none';

        keywordList.style.display = isVisible ? 'none' : 'grid';

        chrome.storage.local.get({ keywords: [] }, (data) => {
            const keywordCount = data.keywords.length;
            this.textContent = !isVisible ? `Hide blocked (${keywordCount})` : `Show blocked (${keywordCount})`;
        });
    });

    document.getElementById('toogleBlockerBtn').addEventListener('click', function () {
        chrome.storage.local.get({ blockerEnabled: true }, data => {
            const newState = !data.blockerEnabled;
            chrome.storage.local.set({ blockerEnabled: newState }, () => {
                this.textContent = newState ? 'Disable Blocker' : 'Enable Blocker';
                const action = newState ? 'blockContent' : 'unblockContent';
                sendMessageToContentScript(action);
            });
        });
    });
});
