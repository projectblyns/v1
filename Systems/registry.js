/* BlynsOS Asset Registry — conventional paths and app/wallpaper lookups. */
(() => {
  'use strict';
  const iconsRoot = '../Assets/Icons/';
  const wallpapersRoot = '../Assets/Wallpapers/';
  const wallpapers = window.BLYNS_WALLPAPERS || [];
  window.BlynsRegistry = Object.freeze({
    iconPath(id) { return iconsRoot + encodeURIComponent(id) + '.png'; },
    fallbackIcon() { return iconsRoot + 'application.png'; },
    wallpaperPath(file) { return wallpapersRoot + file; },
    wallpapers,
    findWallpaper(id) { return wallpapers.find(item => item.id === id) || null; }
  });
})();
