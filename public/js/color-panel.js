window.getColorPanelHtml = function (options) {
    options = options || {};
    var idAttr = options.id ? ' id="' + options.id + '"' : '';
    var panelClass =
        'color-panel flex items-center justify-between px-[30px] py-4 max-[480px]:p-4';
    if (options.className) {
        panelClass += ' ' + options.className;
    }
    var swatchClass =
        'color group/color relative h-6 w-6 animate-scale cursor-pointer rounded-full bg-background max-[480px]:h-[20px] max-[480px]:w-[20px]';
    var tooltipClass =
        'tooltip absolute -bottom-[35px] z-[100] hidden rounded bg-text-primary text-text-inverse group-hover/color:block';
    var swatch =
        '<div class="' +
        swatchClass +
        '" onclick="onColorClick(event)"><div class="' +
        tooltipClass +
        '"></div></div>';
    return '<div class="' + panelClass + '"' + idAttr + '>' + swatch + swatch + swatch + swatch + '</div>';
};
