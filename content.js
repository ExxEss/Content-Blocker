function removeElementsByKeyword(keywords) {
    // Check if keywords array is empty
    if (keywords.length === 0) return;

    // Combine keywords into a single RegExp pattern, case-insensitive
    const pattern = new RegExp(keywords.map(keyword => RegExp.escape(keyword)).join('|'), 'i');

    const elementsToRemove = [];

    // Iterate over all elements in the body
    document.querySelectorAll(
        'body *:not(script):not(style):not(meta)'
    ).forEach(element => {
        if (pattern.test(element.textContent)) {
            const siblings = Array.from(
                element.parentElement.getElementsByClassName(element.className)
            );

            const tagNames = ['A'];
            if (siblings.length > 1 || tagNames.includes(element.tagName)) {
                element.remove();
                console.log('Removed element:', element);
            }
        }

        elementsToRemove.forEach(element => element.remove());
    });
}

// RegExp.escape polyfill for safety, as it's not a standard method yet
if (!RegExp.escape) {
    RegExp.escape = function (s) {
        return String(s).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
    };
}


function observeDOM() {
    const observer = new MutationObserver(mutations => {
        chrome.storage.local.get({ keywords: [] }, function (data) {
            const keywords = data.keywords;
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Check if the node is an element
                        // Check if any keyword is contained in the node's textContent
                        const containsKeyword = keywords.some(keyword => node.textContent.includes(keyword));
                        if (containsKeyword) {
                            node.remove();
                        } else {
                            // Check newly added node's children for keywords
                            removeElementsByKeyword(keywords);
                        }
                    }
                });
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function refreshKeywordsAndBlockContent() {
    chrome.storage.local.get({ keywords: [] }, function (data) {
        const keywords = data.keywords;
        removeElementsByKeyword(keywords);
        observeDOM();
    });
}

// Initial call to block content based on keywords
refreshKeywordsAndBlockContent();

// Listen for messages from popup.js to refresh keywords
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "refreshKeywords") {
        refreshKeywordsAndBlockContent();
    }
});
