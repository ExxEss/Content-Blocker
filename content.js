// RegExp.escape polyfill for safety, as it's not a standard method yet
if (!RegExp.escape) {
    RegExp.escape = function (s) {
        return String(s).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
    };
}

function removeElementsByKeyword(keywords) {
    if (keywords.length === 0) return;

    const pattern = new RegExp(keywords.map(keyword => RegExp.escape(keyword)).join('|'), 'i');
    const elementsToRemove = new Set();

    const treeWalker = createTreeWalker(pattern);

    let node;
    while (node = treeWalker.nextNode()) {
        elementsToRemove.add(node.parentNode); // Consider the parent element of the text node for removal
    }

    // Adjusted logic to convert elementsToRemove Set to Array for iteration
    const elementsToRemoveArray = Array.from(elementsToRemove);
    elementsToRemoveArray.forEach(node => {
        const repetitiveAncestor = getRepetiveAncestor(node);
        console.log('Node to remove:', node);
        console.log('Repetitive ancestor:', repetitiveAncestor);
        if (repetitiveAncestor) {
            elementsToRemove.add(repetitiveAncestor);
        }
    });

    // Now proceed to remove elements
    elementsToRemove.forEach(element => {
        console.log('Removing element:', element);
        element.remove();
    });
}

function createTreeWalker(pattern) {
    return document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: node => {
            // Skip nodes within script, style, meta, and link elements
            if (node.parentNode.tagName === 'SCRIPT' ||
                node.parentNode.tagName === 'STYLE' ||
                node.parentNode.tagName === 'META') {
                return NodeFilter.FILTER_REJECT;
            }

            // Test the node's text content against the pattern
            return pattern.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
    });
}

// Helper function to get the most closest ancestor that is repetive
// A "repetive" ancestor which it's tag is "li" or it's class is repetive in it's parent
function getRepetiveAncestor(node) {
    let current = node;
    while (current && current !== document.body) { // Ensure current is not null and not the body
        if (current.tagName === 'LI') {
            return current; // Return if the tag is LI
        }
        // Convert childNodes to array and filter
        const siblings = Array.from(
            current.parentElement.childNodes
        ).filter(child =>
            child.nodeType === Node.ELEMENT_NODE &&
            current.className &&
            child.className === current.className
        );
        if (siblings.length > 1) {
            console.log('Sibling elements:', siblings);
            return current; // Return if it's a repetitive class name
        }
        current = current.parentElement; // Move up the tree
    }
    return null; // Return null if no repetitive ancestor is found
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
