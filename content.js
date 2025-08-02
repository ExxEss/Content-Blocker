let keywordElements = [];
const currentSite = window.location.hostname;

function hideElementsByKeywords() {
    chrome.storage.local.get({ keywords: [], siteKeywords: {}, blockerEnabled: true }, function (data) {
        if (!data.blockerEnabled) return;

        // Combine global keywords with site-specific keywords
        const globalKeywords = data.keywords || [];
        const siteKeywords = data.siteKeywords?.[currentSite] || [];
        const allKeywords = [...globalKeywords, ...siteKeywords];
        
        if (allKeywords.length === 0) return;

        const pattern = createPattern(allKeywords);
        if (!pattern.test(document.body.textContent)) return;

        const treeWalker = createTreeWalker(pattern);

        let node;
        while (node = treeWalker.nextNode()) {
            const parentElement = node.parentNode;
            const repetitiveAncestor = getRepetitiveAncestor(parentElement);
            if (repetitiveAncestor && !keywordElements.some(el => el.element === repetitiveAncestor)) {
                keywordElements.push({
                    element: repetitiveAncestor,
                    originalHeight: repetitiveAncestor.style.height,
                    originalOverflow: repetitiveAncestor.style.overflow
                });
                repetitiveAncestor.style.height = '0';
                repetitiveAncestor.style.overflow = 'hidden';
                hasKeywordMatch = true;
            }
        }
    });
}

let shouldBlock = true;
function observeDOM() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                if (shouldBlock) {
                    hideElementsByKeywords();
                    
                    setTimeout(() => {
                        hideElementsByKeywords();
                    }, 1000);

                    shouldBlock = false;
                    setTimeout(() => {
                        shouldBlock = true;
                    }, 1000);
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function restoreHiddenElements() {
    keywordElements.forEach(({ element, originalHeight, originalOverflow }) => {
        element.style.height = originalHeight || '';
        element.style.overflow = originalOverflow || '';
        element.style.backgroundColor = 'pink';
    });
    keywordElements = [];
}

function restoreHiddenElementsWithKeyword(keyword, scope, site) {
    const pattern = createPattern([keyword]);
    keywordElements = keywordElements.filter(({ element, originalHeight, originalOverflow }) => {
        if (pattern.test(element.textContent)) {
            // Only restore if the keyword matches the scope
            if (scope === 'global' || (scope === 'site' && site === currentSite)) {
                element.style.height = originalHeight || '';
                element.style.overflow = originalOverflow || '';
                return false;
            }
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
        current = current.parentElement;
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
            hideElementsByKeywords();
            break;
        case 'unblockContent':
            restoreHiddenElements();
            break;
        case 'blockContentWithNewKeyword':
            if (request.data) hideElementsByKeywords();
            break;
        case 'unblockContentWithNewKeyword':
            if (request.data) {
                const { keyword, scope, site } = request.data;
                restoreHiddenElementsWithKeyword(keyword, scope, site);
            }
            break;
        default:
            console.log("Unknown action:", request.action);
            break;
    }
});

(() => {
    hideElementsByKeywords();
    observeDOM();
    revealContent();
})();
