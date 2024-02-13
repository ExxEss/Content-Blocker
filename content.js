let keywordElements = [];

function hideElementsByKeywords() {
    chrome.storage.local.get({ keywords: [], blockerEnabled: true }, function (data) {
        if (!data.blockerEnabled || data.keywords.length === 0) return;

        const pattern = createPattern(data.keywords);
        if (!pattern.test(document.body.textContent)) return;

        const treeWalker = createTreeWalker(pattern);

        let node;
        while (node = treeWalker.nextNode()) {
            const parentElement = node.parentNode;
            const repetitiveAncestor = getRepetitiveAncestor(parentElement) || parentElement;
            if (!keywordElements.some(el => el.element === repetitiveAncestor)) {
                keywordElements.push({
                    element: repetitiveAncestor,
                    originalDisplay: repetitiveAncestor.style.display
                });
                repetitiveAncestor.style.display = 'none';
                hasKeywordMatch = true;
            }
        }
    });
}

function observeDOM() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                console.log('Mutation:', mutation);
                hideElementsByKeywords();
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function logHiddenElements() {
    for (const keywordElement of keywordElements) {
        console.log('Hidden:', keywordElement.element.textContent);
    }
}

function restoreHiddenElements() {
    keywordElements.forEach(({ element, originalDisplay }) => {
        element.style.display = originalDisplay || '';
    });
    keywordElements = [];
}

function restoreHiddenElementsWithKeyword(keyword) {
    const pattern = createPattern([keyword]);
    keywordElements = keywordElements.filter(({ element, originalDisplay }) => {
        if (pattern.test(element.textContent)) {
            element.style.display = originalDisplay || '';
            return false;
        }
        return true;
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
        if (current.tagName === 'LI') {
            return current;
        } else if (current.className) {
            if (isRepetitiveChild(current, true)) {
                return current;
            }
        } else if (current.tagName === 'A') {
            if (isRepetitiveChild(current)) {
                return current;
            }
        }
        current = current.parentElement; // Move up the tree
    }
    return null;
}

// Helper function to check if the node has siblings with the same tag or class
function isRepetitiveChild(node, checkClass = false) {
    const siblings = Array.from(node.parentElement.children);
    const matches = siblings.filter(sibling => {
        return (
            checkClass
                ? sibling.className === node.className && !sibling.id
                : true
        ) && sibling.tagName === node.tagName;
    });
    return matches.length > 1;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.action) {
        case 'blockContent':
            blockContent();
            break;
        case 'unblockContent':
            restoreHiddenElements();
            break;
        case 'blockContentWithNewKeyword':
            if (request.data) hideElementsByKeywords();
            break;
        case 'unblockContentWithNewKeyword':
            if (request.data) restoreHiddenElementsWithKeyword(request.data);
            break;
        default:
            console.log("Unknown action:", request.action);
            break;
    }
});

function blockContent() {
    hideElementsByKeywords();
    revealContent();
    observeDOM();
    logHiddenElements();
}

blockContent(); 
