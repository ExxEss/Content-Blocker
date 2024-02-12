if (!RegExp.escape) {
    RegExp.escape = function (s) {
        return String(s).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
    };
}

function createPattern(keywords) {
    return new RegExp(keywords.map(
        keyword => RegExp.escape(keyword)
    ).join('|'), 'i');
}

function revealContent() {
    document.body.style.setProperty('visibility', 'visible', 'important');
}