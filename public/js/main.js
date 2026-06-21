let imagesPerLoad = 20;
let totalImageSets = 6;
let totalImages = 1374;
let imageContainer = document.querySelector(".image-container");
let loader = document.querySelector(".loader");
let footer = document.querySelector("footer");
let imagesSetsLoaded = 0;
let flag = true;
let favouriteImages = [];
let displayedImageUrls = [];
let precomputedPalettes = {};
let scrollOffset = 70;

function getStoredFavourites() {
    if (!localStorage.getItem("imageHueUrl")) {
        return [];
    }

    try {
        const parsed = JSON.parse(localStorage.getItem("imageHueUrl"));
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function fetchLocalImages() {
    const existingUrls = {};
    const existingImages = imageContainer.querySelectorAll(".item img");

    for (let i = 0; i < existingImages.length; i++) {
        existingUrls[window.normalizeImageUrl(existingImages[i].getAttribute("src"))] = true;
    }

    displayedImageUrls = [];
    for (let i = 0; i < totalImages; i++) {
        const imageUrl = "/unsplash_images/img" + i + ".jpg";
        if (!existingUrls[imageUrl]) {
            displayedImageUrls.push(imageUrl);
        }
    }

    displayedImageUrls = shuffle(displayedImageUrls);
}

function loadImageSetFromJson() {
    createImageSetFromJson();
}

function createImageSetFromJson() {
    if (imagesSetsLoaded < totalImageSets && displayedImageUrls.length > 0) {
        loader.style.display = "flex";
        footer.style.display = "none";

        const start = imagesSetsLoaded * imagesPerLoad;
        const end = Math.min(start + imagesPerLoad, displayedImageUrls.length);
        for (let i = start; i < end; i++) {
            createImageCard(displayedImageUrls[i], { lazy: true });
        }

        imagesSetsLoaded++;
    }
    else {
        loader.style.display = "none";
        footer.style.display = "block";
    }
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function createImageCard(url, options) {
    const prepend = options && options.prepend;
    const lazy = options && options.lazy;
    let item = document.createElement('div');
    item.className = 'item group relative m-0 w-auto animate-slide-up rounded-[18px] bg-surface p-2.5 shadow-card';
    item.innerHTML = `
                <img alt="Curated photo color palette" width="400" height="300" decoding="async" class="w-full rounded-[6px]"/>
                ${window.getColorPanelHtml()}
                <div class="favourite absolute top-2.5 right-2.5 hidden h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface opacity-0 transition-all duration-300 group-hover:flex group-hover:opacity-100" onclick="addRemoveFavourites(event)" aria-label="Save palette to favourites" role="button" tabindex="0">
                    <svg class="h-4 w-4" viewBox="0 0 14.231 12.094" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <g transform="translate(-1.999 -4)">
                        <g transform="translate(1.999 4)" data-name="Layer 2">
                        <path transform="translate(-1.999 -4)" d="M9.114,16.095a.711.711,0,0,1-.505-.206L3.081,10.353A3.723,3.723,0,1,1,8.346,5.089l.768.768.768-.768a3.723,3.723,0,1,1,5.265,5.265L9.619,15.888A.711.711,0,0,1,9.114,16.095ZM5.713,5.423a2.277,2.277,0,0,0-1.622.669,2.305,2.305,0,0,0,0,3.251l5.023,5.03,5.023-5.03a2.305,2.305,0,0,0,0-3.251,2.362,2.362,0,0,0-3.244,0L9.619,7.372a.711.711,0,0,1-1.01,0L7.335,6.092a2.277,2.277,0,0,0-1.622-.669Z" fill="#202428"/>
                        </g>
                        </g>
                    </svg>
                </div>
            `;

    let img = item.children[0];
    img.setAttribute("crossorigin", "anonymous");
    if (lazy) {
        img.setAttribute("loading", "lazy");
    }
    img.addEventListener('load', function () {
        findColors(item);
        loadFavourites(item);
    });
    img.addEventListener('error', function () {
        if (loader) {
            loader.style.display = "none";
        }
    });
    if (prepend) {
        imageContainer.prepend(item);
    } else {
        imageContainer.appendChild(item);
    }
    img.src = url;
}

function fillPalette(colors, colorElements) {
    if (!colors || colors.length < colorElements.length) {
        return;
    }

    for (let i = 0; i < colorElements.length; i++) {
        const color = colorElements[i];
        color.style.backgroundColor = `rgb(${colors[i][0]}, ${colors[i][1]}, ${colors[i][2]})`;
        color.children[0].innerHTML = "<span>" + rgbToHex(colors[i][0], colors[i][1], colors[i][2]) + "</span>";
    }
}

function getPaletteFromImage(img) {
    const imageUrl = window.normalizeImageUrl(img.getAttribute('src'));
    const cached = precomputedPalettes[imageUrl];

    if (cached && cached.length >= 4) {
        return cached.map(function (entry) { return entry.rgb; });
    }

    const colorThief = new ColorThief();
    return colorThief.getPalette(img, 4, 5);
}

function findColors(item) {
    const img = item.children[0];
    const colorPanel = img.nextElementSibling;
    const colorElements = colorPanel.children;
    fillPalette(getPaletteFromImage(img), colorElements);
}

function onColorClick(e) {
    const colorElement = e.currentTarget;
    let rgbColor = getRGB(colorElement.style.backgroundColor);
    if (!rgbColor.red) {
        return;
    }

    let hexColor = rgbToHex(rgbColor.red, rgbColor.green, rgbColor.blue);
    copyToClipboard(hexColor);
    colorElement.children[0].innerHTML = "<span>Copied</span>";
    setTimeout(() => {
        colorElement.children[0].innerHTML = "<span>" + hexColor + "</span>";
    }, 2000);
}

function getRGB(str) {
    var match = str.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
    return match ? {
        red: match[1],
        green: match[2],
        blue: match[3]
    } : {};
}

function copyToClipboard(str) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(str).catch(function () {
            fallbackCopyToClipboard(str);
        });
        return;
    }
    fallbackCopyToClipboard(str);
}

function fallbackCopyToClipboard(str) {
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    const selection = document.getSelection();
    const selected = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : false;
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    if (selected && selection) {
        selection.removeAllRanges();
        selection.addRange(selected);
    }
}

function convertToHex(rgb) {
    let hex = Number(rgb).toString(16);
    if (hex.length < 2) {
        hex = "0" + hex;
    }
    return hex;
}

function rgbToHex(r, g, b) {
    return '#' + convertToHex(r) + convertToHex(g) + convertToHex(b);
}

function addRemoveFavourites(event) {
    favouriteImages = getStoredFavourites();
    let imageUrl = window.normalizeImageUrl(
        event.currentTarget.parentElement.children[0].getAttribute("src")
    );

    for (let i = 0; i < favouriteImages.length; i++) {
        if (window.imageUrlsMatch(imageUrl, favouriteImages[i].url)) {
            event.currentTarget.classList.remove("added");
            favouriteImages.splice(i, 1);
            localStorage.setItem("imageHueUrl", JSON.stringify(favouriteImages));
            return;
        }
    }

    let colorPalette = event.currentTarget.parentElement.children[1];
    favouriteImages.push({
        url: imageUrl,
        color1: colorPalette.children[0].style.backgroundColor,
        color2: colorPalette.children[1].style.backgroundColor,
        color3: colorPalette.children[2].style.backgroundColor,
        color4: colorPalette.children[3].style.backgroundColor,
    });
    event.currentTarget.classList.add("added");
    localStorage.setItem("imageHueUrl", JSON.stringify(favouriteImages));
}

function loadFavourites(item) {
    const favouriteButton = item.querySelector(".favourite");
    if (!favouriteButton) {
        return;
    }

    const imageUrl = window.normalizeImageUrl(item.children[0].getAttribute("src"));
    favouriteImages = getStoredFavourites();
    favouriteButton.classList.remove("added");
    for (let i = 0; i < favouriteImages.length; i++) {
        if (window.imageUrlsMatch(imageUrl, favouriteImages[i].url)) {
            favouriteButton.classList.add("added");
            return;
        }
    }
}

function hydrateServerRenderedCards() {
    const serverCards = imageContainer.querySelectorAll(".item");
    for (let i = 0; i < serverCards.length; i++) {
        loadFavourites(serverCards[i]);
    }
}

window.addEventListener("scroll", () => {
    if (Math.ceil(window.innerHeight + document.documentElement.scrollTop) >= document.body.offsetHeight - scrollOffset) {
        if (flag) {
            setTimeout(loadImageSetFromJson, 500);
        }
        flag = false;
    }
    else {
        flag = true;
    }
});

function loadPrecomputedPalettes() {
    return fetch('/data/palettes.json')
        .then(function (response) {
            if (!response.ok) {
                return {};
            }
            return response.json();
        })
        .then(function (data) {
            precomputedPalettes = data || {};
        })
        .catch(function () {
            precomputedPalettes = {};
        });
}

function startApp() {
    hydrateServerRenderedCards();
    fetchLocalImages();
}

function initImageUpload() {
    const input = document.getElementById('image-upload');
    const dropzone = document.getElementById('upload-dropzone');
    const initialState = document.getElementById('upload-initial');
    const resultState = document.getElementById('upload-result');
    const previewImg = document.getElementById('upload-preview-img');
    const colorPanel = document.getElementById('upload-color-panel');

    if (!input || !dropzone || !initialState || !resultState || !previewImg || !colorPanel) {
        return;
    }

    const colorElements = colorPanel.querySelectorAll('.color');
    let currentUploadUrl = null;
    let dragCounter = 0;

    function lockUploadSectionHeight() {
        dropzone.style.minHeight = dropzone.offsetHeight + 'px';
    }

    const initialImage = initialState.querySelector('img');
    if (initialImage.complete) {
        lockUploadSectionHeight();
    } else {
        initialImage.addEventListener('load', lockUploadSectionHeight);
    }
    window.addEventListener('load', lockUploadSectionHeight);
    window.addEventListener('resize', function () {
        if (!initialState.classList.contains('hidden')) {
            lockUploadSectionHeight();
        }
    });

    function showUploadResult(url) {
        if (currentUploadUrl) {
            URL.revokeObjectURL(currentUploadUrl);
        }
        currentUploadUrl = url;
        previewImg.src = url;

        previewImg.onload = function () {
            fillPalette(getPaletteFromImage(previewImg), colorElements);
            initialState.classList.add('hidden');
            resultState.classList.remove('hidden');
        };
    }

    function handleImageFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            return;
        }

        showUploadResult(URL.createObjectURL(file));
        input.value = '';
    }

    input.addEventListener('change', function (event) {
        const file = event.target.files && event.target.files[0];
        handleImageFile(file);
    });

    dropzone.addEventListener('dragenter', function (event) {
        event.preventDefault();
        dragCounter++;
        dropzone.classList.add('upload-section--dragover');
    });

    dropzone.addEventListener('dragover', function (event) {
        event.preventDefault();
    });

    dropzone.addEventListener('dragleave', function (event) {
        event.preventDefault();
        dragCounter--;
        if (dragCounter <= 0) {
            dragCounter = 0;
            dropzone.classList.remove('upload-section--dragover');
        }
    });

    dropzone.addEventListener('drop', function (event) {
        event.preventDefault();
        dragCounter = 0;
        dropzone.classList.remove('upload-section--dragover');

        const file = event.dataTransfer.files && event.dataTransfer.files[0];
        handleImageFile(file);
    });
}

window.onColorClick = onColorClick;
window.addRemoveFavourites = addRemoveFavourites;

loadPrecomputedPalettes().finally(function () {
    startApp();
    initImageUpload();
});
