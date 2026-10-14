/**
 * 终端绿 · 皮肤定义（示例：固定深色 + 扫描线装饰，纯 CSS）
 *
 * 演示「固定深色」写法：token 全部给裸字符串，两臂同色，
 * 因此无论应用处于明还是暗，皮肤恒为深色。
 */
;(function (window) {
  'use strict';

  var sheets = window.__DSH_SKIN_SHEETS__ || {};
  var sheet = sheets.terminalGreen || {};
  var base = sheet.flat || {};

  // 裸字符串 = 两侧同色（引擎会包成 { light: v, dark: v }）。
  var tokens = {};
  Object.keys(base).forEach(function (k) {
    tokens[k] = base[k];
  });

  window.__DSH_SKINS__['terminal-green'] = {
    id: 'terminal-green',
    label: '终端绿',
    hint: '黑底荧光绿 · 固定深色',
    swatch: ['#080c08', '#33ff66', '#121a12', '#c8ffd8'],
    tokens: tokens,
    css: {
      '*': function () {
        return [
          '/* 终端绿：CRT 扫描线 + 极轻的屏幕辉光，纯 CSS */',
          'body::before {',
          '  content: "";',
          '  position: fixed; inset: 0;',
          '  z-index: 2147483000; pointer-events: none;',
          '  opacity: .16;',
          '  background: repeating-linear-gradient(0deg, rgba(0,0,0,.55) 0 1px, transparent 1px 3px);',
          '}',
          'body::after {',
          '  content: "";',
          '  position: fixed; inset: 0;',
          '  z-index: -1; pointer-events: none;',
          '  background: radial-gradient(120% 90% at 50% 0%, rgba(51,255,102,.07) 0%, transparent 62%);',
          '}',
          '/* 等宽字体贯穿全文，终端感 */',
          'body, input, textarea, button, [class*="markdown"] {',
          '  font-family: ui-monospace, "Cascadia Mono", Consolas, "Courier New", monospace;',
          '}',
          '[class*="markdown"] pre { border-left: 4px solid #33ff66 !important; }',
          '@media (prefers-reduced-motion: reduce) {',
          '  body::before { opacity: .08; }',
          '}',
        ].join('\n');
      },
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
