window.normalizeImageUrl = function (url) {
    if (!url) {
        return url;
    }

    var map = window.IMAGEHUES_URL_MAP || {};
    if (map[url]) {
        return map[url];
    }

    var localMatch = url.match(/(?:\.\/|\.\.\/)?unsplash_images\/(img\d+\.jpg)$/);
    if (localMatch) {
        return '/unsplash_images/' + localMatch[1];
    }

    if (url.charAt(0) !== '/' && url.indexOf('unsplash_images/') === 0) {
        return '/' + url;
    }

    return url;
};

window.imageUrlsMatch = function (a, b) {
    return window.normalizeImageUrl(a) === window.normalizeImageUrl(b);
};

(function () {
    var nav = document.getElementById('nav-items'),
        link = nav.getElementsByTagName('li'),
        parts = window.location.pathname.replace(/\/$/, '').split('/'),
        current = parts[parts.length - 1] || 'home';
    if (current === 'home' || current === 'index.html') {
        link[0].className = "active";
        return;
    }
    for (var i = 0; i < link.length; i++) {
        if (link[i].children[0].className === current) {
            link[i].className = "active";
        }
    }
})();
