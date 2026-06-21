let imagesPerLoad = 20;
let totalImageSets = 5;
let imageContainer = document.querySelector(".image-container");
let loader = document.querySelector(".loader");
let imagesSetsLoaded = 0;
let flag = true;
let favouriteImages = [];

function loadImages() {
    if (localStorage.getItem("imageHueUrl")) {
        favouriteImages = JSON.parse(localStorage.getItem("imageHueUrl"));
        for (let i = 0; i < favouriteImages.length; i++) {
            createImage(i, favouriteImages[i]);
        }
        if (favouriteImages.length === 0) {
            document.getElementById("empty-favourites-page").style.display = "block";
        }
        else {
            document.getElementById("empty-favourites-page").style.display = "none";
        }
    }
};

loadImages();

function createImage(index, imageProperties) {

    let item = document.createElement('div');
    item.className = 'item' + imagesSetsLoaded + '' + index + ' item group relative m-0 w-auto animate-slide-up rounded-[18px] bg-surface p-2.5 shadow-card';
    item.innerHTML = `
                <img src="${imageProperties.url}" alt="random image" class="w-full rounded-[6px]"/>
                ${window.getColorPanelHtml({ className: 'color-panel' + index })}
                <div class="favourite close absolute top-2.5 right-2.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface" onclick="removeFavourites(event)">
                    <svg class="h-3 w-3" viewBox="0 0 12.012 12.01" xmlns="http://www.w3.org/2000/svg">
                        <g transform="translate(-5.994 -5.996)">
                        <g data-name="Layer 2">
                        <path d="M13.41,12l4.3-4.29a1,1,0,1,0-1.42-1.42L12,10.59,7.71,6.29A1,1,0,0,0,6.29,7.71L10.59,12l-4.3,4.29a1,1,0,1,0,1.42,1.42L12,13.41l4.29,4.3a1,1,0,1,0,1.42-1.42Z" fill="#111" data-name="close"/>
                        </g>
                        </g>
                    </svg>
                </div>
            
            `
    imageContainer.appendChild(item);
    item.children[0].setAttribute("crossorigin", "anonymous");

    const color1 = item.children[0].nextElementSibling.children[0];
    const color2 = item.children[0].nextElementSibling.children[1];
    const color3 = item.children[0].nextElementSibling.children[2];
    const color4 = item.children[0].nextElementSibling.children[3];


    color1.style.backgroundColor = imageProperties.color1;
    color2.style.backgroundColor = imageProperties.color2;
    color3.style.backgroundColor = imageProperties.color3;
    color4.style.backgroundColor = imageProperties.color4;

    const color1Hex = rgbToHex(getRGB(color1.style.backgroundColor).red, getRGB(color1.style.backgroundColor).green, getRGB(color1.style.backgroundColor).blue);
    const color2Hex = rgbToHex(getRGB(color2.style.backgroundColor).red, getRGB(color2.style.backgroundColor).green, getRGB(color2.style.backgroundColor).blue);
    const color3Hex = rgbToHex(getRGB(color3.style.backgroundColor).red, getRGB(color3.style.backgroundColor).green, getRGB(color3.style.backgroundColor).blue);
    const color4Hex = rgbToHex(getRGB(color4.style.backgroundColor).red, getRGB(color4.style.backgroundColor).green, getRGB(color4.style.backgroundColor).blue);

    color1.children[0].innerHTML = "<span>" + color1Hex + "</span>";
    color2.children[0].innerHTML = "<span>" + color2Hex + "</span>";
    color3.children[0].innerHTML = "<span>" + color3Hex + "</span>";
    color4.children[0].innerHTML = "<span>" + color4Hex + "</span>";
    // findColors(item);

}



function onColorClick(e) {
    let rgbColor = getRGB(e.target.style.backgroundColor);
    let red = rgbColor.red;
    let green = rgbColor.green;
    let blue = rgbColor.blue;
    let hexColor = rgbToHex(red, green, blue);
    copyToClipboard(hexColor);
    e.target.children[0].innerHTML = "<span>Copied</span>";
    setTimeout(() => {
        e.target.children[0].innerHTML = "<span>" + hexColor + "</span>";
    }, 4000);


    function copyToClipboard(str) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(str).catch(fallbackCopyToClipboard);
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
        const selected =
            document.getSelection().rangeCount > 0 ? document.getSelection().getRangeAt(0) : false;
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        if (selected) {
            document.getSelection().removeAllRanges();
            document.getSelection().addRange(selected);
        }
    }
}


function convertToHex(rgb) {
    let hex = Number(rgb).toString(16);
    if (hex.length < 2) {
        hex = "0" + hex;
    }
    return hex;
};


function rgbToHex(r, g, b) {
    let red = convertToHex(r);
    let green = convertToHex(g);
    let blue = convertToHex(b);
    return '#' + red + green + blue;
};

function getRGB(str) {
    var match = str.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
    return match ? {
        red: match[1],
        green: match[2],
        blue: match[3]
    } : {};
}


function removeFavourites(event) {

    let imageUrl = window.normalizeImageUrl(
        event.currentTarget.parentElement.children[0].getAttribute("src")
    );
    for (let i = 0; i < favouriteImages.length; i++) {
        if (window.imageUrlsMatch(imageUrl, favouriteImages[i].url)) {
            event.currentTarget.classList.remove("added");
            favouriteImages.splice(i, 1);
            localStorage.setItem("imageHueUrl", JSON.stringify(favouriteImages));
        }
    }

    event.currentTarget.parentElement.remove();

}










