(function () {
    var STORAGE_KEY = 'imageHueUrl';
    var MIGRATION_KEY = 'imageHueUrlMigratedV2';
    var raw = localStorage.getItem(STORAGE_KEY);

    if (!raw || localStorage.getItem(MIGRATION_KEY) === '1') {
        return;
    }

    var favourites;
    try {
        favourites = JSON.parse(raw);
    } catch (error) {
        return;
    }

    if (!Array.isArray(favourites)) {
        return;
    }

    var map = window.IMAGEHUES_URL_MAP || {};

    function normalizeImageUrl(url) {
        if (!url) {
            return url;
        }

        if (map[url]) {
            return map[url];
        }

        var localMatch = url.match(/(?:\.\/|\.\.\/)?unsplash_images\/(img\d+\.jpg)$/);
        if (localMatch) {
            return '/unsplash_images/' + localMatch[1];
        }

        return url;
    }

    var changed = false;
    var seen = {};
    var migrated = [];

    for (var i = 0; i < favourites.length; i++) {
        var favourite = favourites[i];
        if (!favourite || !favourite.url) {
            continue;
        }

        var normalizedUrl = normalizeImageUrl(favourite.url);
        if (normalizedUrl !== favourite.url) {
            changed = true;
        }

        if (seen[normalizedUrl]) {
            changed = true;
            continue;
        }

        seen[normalizedUrl] = true;
        migrated.push({
            url: normalizedUrl,
            color1: favourite.color1,
            color2: favourite.color2,
            color3: favourite.color3,
            color4: favourite.color4,
        });
    }

    if (migrated.length !== favourites.length) {
        changed = true;
    }

    if (changed) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    }

    localStorage.setItem(MIGRATION_KEY, '1');
})();
