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
        const repetitiveAncestor = getRepetitiveAncestor(node);
        if (repetitiveAncestor) {
            elementsToRemove.add(repetitiveAncestor);
        }
    });

    // Now proceed to remove elements
    elementsToRemove.forEach(element => {
        element.remove();
        console.log('Removed:', element);
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

// Helper function to find the repetitive ancestor of a node
function getRepetitiveAncestor(node) {
    let current = node;
    while (current && current !== document.body) {
        // Check for LI or A tags directly or consider a broader approach
        if (current.tagName === 'LI' || current.tagName === 'A') {
            if (isRepetitiveSibling(current)) {
                return current;
            }
        } else if (current.className && isRepetitiveSibling(current, true)) {
            // Check for repetitive class names only if the current node has a class
            return current;
        }

        current = current.parentElement; // Move up the tree
    }
    return null;
}

// Helper function to check if the node has siblings with the same tag or class
function isRepetitiveSibling(node, checkClass = false) {
    const siblings = Array.from(node.parentElement.children); // Use .children for element nodes only
    const matches = siblings.filter(sibling => {
        // Check by tag name or class name based on `checkClass` flag
        return checkClass ? sibling.className === node.className : sibling.tagName === node.tagName;
    });
    // Considered repetitive if more than one match is found (including the node itself)
    return matches.length > 1;
}


// Assuming the rest of your code remains unchanged, update the observeDOM and refreshKeywordsAndBlockContent functions
function observeDOM() {
    chrome.storage.local.get({ blockerEnabled: true }, function (data) {
        if (!data.blockerEnabled) return; // Exit if blocker is disabled

        const observer = new MutationObserver(mutations => {
            chrome.storage.local.get({ keywords: [] }, function (data) {
                const keywords = data.keywords;
                if (keywords.length === 0 || !data.blockerEnabled) return; // Check if blocker is enabled

                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Check if the node is an element
                            const containsKeyword = keywords.some(keyword => node.textContent.includes(keyword));
                            if (containsKeyword) {
                                node.remove();
                            } else {
                                removeElementsByKeyword(keywords);
                            }
                        }
                    });
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    });
}

function refreshKeywordsAndBlockContent() {
    chrome.storage.local.get({ keywords: [], blockerEnabled: true }, function (data) {
        if (!data.blockerEnabled) return; // Exit if blocker is disabled

        const keywords = data.keywords;
        removeElementsByKeyword(keywords);
        observeDOM();
    });
}

// Adjust initial call and message listener to check blockerEnabled state
refreshKeywordsAndBlockContent(); // Initial call to setup, conditional inside functions

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'blockContent') {
        refreshKeywordsAndBlockContent(); // This will now check blocker state internally
    }
});

