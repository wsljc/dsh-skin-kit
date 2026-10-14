/**
 * P5R 漫画皮肤 · 装饰 DOM
 *
 * 唯一一处需要真实 DOM 的装饰：给背景图里那块「悬吊発車標」叠一层同位置、
 * 同漂移的牌子，让上面的字能横向滚动（静态图片做不到）。
 *
 * 几何来自 skins/p5r/skin.js 的 BOARD（按原图 1822×1024 逐点量得）。
 */
;(function (window) {
  'use strict';

  function buildBoard(skin) {
    var BOARD = skin.board || {};
    var topText = BOARD.topText || '';
    var bottomText = BOARD.bottomText || '';

    // 一份文案 + 自带尾部留白当分隔，两份首尾相接才能无缝循环。
    function copies(text) {
      return (
        '<span class="p5r-board-copy">' + text + '</span>' +
        '<span class="p5r-board-copy">' + text + '</span>'
      );
    }

    var layer = document.createElement('div');
    layer.className = 'p5r-board-layer';
    layer.innerHTML =
      '<div class="p5r-board-cover"><div class="p5r-board-drift">' +
      '<div class="p5r-board">' +
      '<div class="p5r-board-line p5r-board-line--top">' +
      '<span class="p5r-board-track">' + copies(topText) + '</span>' +
      '</div>' +
      '<div class="p5r-board-line p5r-board-line--bottom">' +
      '<span class="p5r-board-track">' + copies(bottomText) + '</span>' +
      '</div>' +
      '</div>' +
      '</div></div>';
    return layer;
  }

  var NS = (window.__DSH_SKIN_DECOR__ = window.__DSH_SKIN_DECOR__ || {});
  NS.p5rBoard = buildBoard;
})(typeof window !== 'undefined' ? window : globalThis);
