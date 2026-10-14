/**
 * P5R 漫画皮肤 · 定义
 *
 * 《女神异闻录5 皇家版》的配色与漫画手法。两个档位：
 *   comic —— 全彩（红黑黄纸白），固定深色
 *   plain —— 灰阶、去投影，保留「朴素」的阅读意图
 *
 * 版权说明：P5R 的视觉语言归 ATLUS 所有。这里只借用「配色 + 漫画插画手法」
 * 做界面皮肤，**不含任何游戏素材**；背景图请按 skins/p5r/ASSETS.md 自行替换。
 */
;(function (window) {
  'use strict';

  var sheets = window.__DSH_SKIN_SHEETS__ || {};
  var decor = window.__DSH_SKIN_DECOR__ || {};
  var p5r = sheets.p5r || {};

  // 背景站牌的几何：单位是「相对按 cover 铺满后的图片盒」的百分比，
  // 按原图逐点量得（原图 1822×1024：牌子约占 x 69.4%–77.6%、
  // y 23.3%–29.9%，整体带约 -7° 倾角）。换图后需要重新量。
  var BOARD = {
    left: 69.4,
    top: 23.3,
    width: 8.2,
    height: 6.6,
    rotate: -7,
    /** 上行：小号黄字。改这里即可换内容。 */
    topText: '4番線  DEEPSEEK HARNESS  ',
    /** 下行：日本站台最典型的广播（列车进站，请退到黄线内侧）。 */
    bottomText: '電車が参ります。黄色い線の内側まで、お下がりください。  ',
  };

  var colors = Object.assign({}, p5r.colors || {}, { BOARD: BOARD });

  window.__DSH_SKINS__['p5r-comic'] = {
    id: 'p5r-comic',
    label: 'P5R 漫画',
    hint: '红黑黄纸白 · 固定深色',
    swatch: ['#0b0b0e', '#e60012', '#ffd800', '#fffdf4'],
    default: true,
    defaultVariant: 'comic',

    // 基础调色板：全彩。裸字符串 = 两臂同色 = 固定深色。
    tokens: p5r.base || {},

    variants: {
      comic: { label: '全彩' },
      plain: {
        label: '朴素（灰阶去影）',
        // 补丁叠在基础调色板上，只换强调色与投影。
        tokens: p5r.plainPatch || {},
      },
    },

    // 装饰 CSS 与装饰 DOM 都只给 comic 档位；plain 档位不加装饰。
    css: {
      comic: function () {
        return decor.p5rDecor ? decor.p5rDecor(colors) : '';
      },
    },
    dom: {
      comic: decor.p5rBoard,
    },

    /** 供装饰层读取的几何与文案。 */
    board: BOARD,
  };
})(typeof window !== 'undefined' ? window : globalThis);
