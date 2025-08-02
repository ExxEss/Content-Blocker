// Helper functions
let currentSite = '';

function getKeyword() {
    return document.getElementById('keywordInput').value.trim();
}

function getKeywordScope() {
    return document.querySelector('input[name="keywordScope"]:checked').value;
}

function clearInputField() {
    document.getElementById('keywordInput').value = '';
}

function extractDomain(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

function toggleButtonVisibility(globalCount, siteCount) {
    const toggleKeywordBtn = document.getElementById('toggleKeywordBtn');
    const totalCount = globalCount + siteCount;
    toggleKeywordBtn.style.display = totalCount > 0 ? '' : 'none';
    toggleKeywordBtn.textContent = `Show blocked (${totalCount})`;
}

function updateKeywordsUI(data) {
    updateGlobalKeywordList(data.keywords || []);
    updateSiteKeywordList(data.siteKeywords?.[currentSite] || []);
    toggleButtonVisibility(
        (data.keywords || []).length, 
        (data.siteKeywords?.[currentSite] || []).length
    );
}

// CRUD operations
function addKeyword(keyword) {
    const scope = getKeywordScope();
    const storageKey = scope === 'global' ? 'keywords' : 'siteKeywords';
    
    chrome.storage.local.get({ keywords: [], siteKeywords: {} }, function (data) {
        if (scope === 'global') {
            if (!data.keywords.includes(keyword)) {
                data.keywords.unshift(keyword);
                chrome.storage.local.set({ keywords: data.keywords }, function () {
                    clearInputField();
                    showKeywordLists();
                    updateKeywordsUI(data);
                    sendMessageToContentScript('blockContentWithNewKeyword', { keyword, scope: 'global' });
                });
            }
        } else {
            if (!data.siteKeywords[currentSite]) {
                data.siteKeywords[currentSite] = [];
            }
            if (!data.siteKeywords[currentSite].includes(keyword)) {
                data.siteKeywords[currentSite].unshift(keyword);
                chrome.storage.local.set({ siteKeywords: data.siteKeywords }, function () {
                    clearInputField();
                    showKeywordLists();
                    updateKeywordsUI(data);
                    sendMessageToContentScript('blockContentWithNewKeyword', { keyword, scope: 'site', site: currentSite });
                });
            }
        }
    });
}

function removeKeyword(keyword, scope) {
    chrome.storage.local.get({ keywords: [], siteKeywords: {} }, function (data) {
        if (scope === 'global') {
            data.keywords = data.keywords.filter(k => k !== keyword);
            chrome.storage.local.set({ keywords: data.keywords }, function () {
                updateKeywordsUI(data);
                sendMessageToContentScript('unblockContentWithNewKeyword', { keyword, scope: 'global' });
            });
        } else {
            if (data.siteKeywords[currentSite]) {
                data.siteKeywords[currentSite] = data.siteKeywords[currentSite].filter(k => k !== keyword);
                if (data.siteKeywords[currentSite].length === 0) {
                    delete data.siteKeywords[currentSite];
                }
                chrome.storage.local.set({ siteKeywords: data.siteKeywords }, function () {
                    updateKeywordsUI(data);
                    sendMessageToContentScript('unblockContentWithNewKeyword', { keyword, scope: 'site', site: currentSite });
                });
            }
        }
    });
}

// Update UI
function updateGlobalKeywordList(keywords) {
    const keywordList = document.getElementById('globalKeywordList');
    keywordList.innerHTML = '';
    keywords.forEach(keyword => {
        let li = document.createElement('li');
        li.textContent = keyword + " ";

        let deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => removeKeyword(keyword, 'global');

        li.appendChild(deleteBtn);
        keywordList.appendChild(li);
    });
}

function updateSiteKeywordList(keywords) {
    const keywordList = document.getElementById('siteKeywordList');
    keywordList.innerHTML = '';
    keywords.forEach(keyword => {
        let li = document.createElement('li');
        li.textContent = keyword + " ";

        let deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => removeKeyword(keyword, 'site');

        li.appendChild(deleteBtn);
        keywordList.appendChild(li);
    });
}

function showKeywordLists() {
    const globalKeywordList = document.getElementById('globalKeywordList');
    const siteKeywordList = document.getElementById('siteKeywordList');
    globalKeywordList.style.display = 'grid';
    siteKeywordList.style.display = 'grid';
}

// Messaging
const sendMessageToContentScript = (action, data) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { action, data }));
    });
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Get current tab info
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            currentSite = extractDomain(tabs[0].url);
            document.getElementById('currentSite').textContent = currentSite;
        }
    });

    chrome.storage.local.get({ keywords: [], siteKeywords: {}, blockerEnabled: true }, function (data) {
        updateKeywordsUI(data);
        const toogleBlockerBtn = document.getElementById('toggleBlockerBtn');
        toogleBlockerBtn.textContent = data.blockerEnabled ? 'Disable Blocker' : 'Enable Blocker';
    });

    document.getElementById('keywordInput').focus();

    document.getElementById('keywordInput').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const keyword = getKeyword();
            if (keyword) {
                addKeyword(keyword);
            }
        }
    });

    document.getElementById('toggleBlockerBtn').addEventListener('click', function () {
        chrome.storage.local.get({ blockerEnabled: true }, data => {
            const newState = !data.blockerEnabled;
            chrome.storage.local.set({ blockerEnabled: newState }, () => {
                this.textContent = newState ? 'Disable Blocker' : 'Enable Blocker';
                const action = newState ? 'blockContent' : 'unblockContent';
                sendMessageToContentScript(action);
            });
        });
    });

    document.getElementById('toggleKeywordBtn').addEventListener('click', function () {
        const globalKeywordList = document.getElementById('globalKeywordList');
        const siteKeywordList = document.getElementById('siteKeywordList');
        const isVisible = window.getComputedStyle(globalKeywordList).display !== 'none';

        globalKeywordList.style.display = isVisible ? 'none' : 'grid';
        siteKeywordList.style.display = isVisible ? 'none' : 'grid';

        chrome.storage.local.get({ keywords: [], siteKeywords: {} }, (data) => {
            const globalCount = data.keywords.length;
            const siteCount = (data.siteKeywords[currentSite] || []).length;
            const totalCount = globalCount + siteCount;
            this.textContent = !isVisible ? `Hide blocked (${totalCount})` : `Show blocked (${totalCount})`;
        });
    });
});
