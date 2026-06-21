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
    var nav = document.getElementById('nav-items');
    if (!nav) return;

    var links = nav.getElementsByTagName('a');
    var path = window.location.pathname.replace(/\/index\.html$/, '/').replace(/\/+$/, '') || '/';

    for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute('href');
        if (!href) continue;

        var linkPath = href.replace(/\/index\.html$/, '/').replace(/\/+$/, '') || '/';
        if (path === linkPath) {
            links[i].classList.add('active');
        }
    }
})();
