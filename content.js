// RegExp.escape polyfill for safety, as it's not a standard method yet
if (!RegExp.escape) {
    RegExp.escape = function (s) {
        return String(s).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
    };
}

let keywordElements = [];

function hideElementsByKeywords(keywords) {
    if (keywords.length === 0) return;

<<<<<<< HEAD
    const pattern = new RegExp(
        keywords.map(
            keyword => RegExp.escape(keyword)
        ).join('|'), 'i'
    );
=======
    const pattern = new RegExp(keywords.map(keyword => RegExp.escape(keyword)).join('|'), 'i');
>>>>>>> 39e37315026cb80a86cce3aede20466b4fd4b860
    const treeWalker = createTreeWalker(pattern);

    let node;
    while (node = treeWalker.nextNode()) {
        const parentElement = node.parentNode;
        const repetitiveAncestor = getRepetitiveAncestor(parentElement) || parentElement;
        if (!keywordElements.some(el => el.element === repetitiveAncestor)) {
            keywordElements.push({ element: repetitiveAncestor, originalDisplay: repetitiveAncestor.style.display });
            repetitiveAncestor.style.display = 'none'; // Hide the element
        }
    }
<<<<<<< HEAD

    // Log the list of hidden elements for debugging
    logHiddenElements();
}

function logHiddenElements() {
    for (const keywordElement of keywordElements) {
        console.log('Hidden:', keywordElement.element);
    }
}

=======
}

>>>>>>> 39e37315026cb80a86cce3aede20466b4fd4b860
function restoreHiddenElements() {
    keywordElements.forEach(({ element, originalDisplay }) => {
        element.style.display = originalDisplay || ''; // Restore original display style or default
    });
    keywordElements = []; // Clear the list after restoring
}

function restoreHiddenElementsWithKeyword(keyword) {
    const pattern = new RegExp(RegExp.escape(keyword), 'i');
    keywordElements = keywordElements.filter(({ element, originalDisplay }) => {
        if (pattern.test(element.textContent)) {
            element.style.display = originalDisplay || ''; // Restore visibility
            return false; // Remove from tracking
        }
        return true; // Keep others as is
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
                                hideElementsByKeywords(keywords);
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
        hideElementsByKeywords(keywords);
        observeDOM();
    });
}

// Adjust initial call and message listener to check blockerEnabled state
refreshKeywordsAndBlockContent(); // Initial call to setup, conditional inside functions

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.action) {
        case 'blockContent':
            refreshKeywordsAndBlockContent();
            break;
        case 'unblockContent':
            restoreHiddenElements();
            break;
        case 'blockContentWithNewKeyword':
            if (request.data) {
                // Ensure hideElementsByKeyword expects and handles an array of keywords
<<<<<<< HEAD
                hideElementsByKeywords([request.data]);
=======
                hideElementsByKeywords([request.data]); 
>>>>>>> 39e37315026cb80a86cce3aede20466b4fd4b860
            }
            break;
        case 'unblockContentWithNewKeyword':
            if (request.data) {
                // Correct function name to match its purpose and ensure it's implemented
                restoreHiddenElementsWithKeyword(request.data);
            }
            break;
        default:
            console.log("Unknown action:", request.action);
            break;
    }
});



