/**
 * 纸白纸墨 · 皮肤定义（示例：明暗自适应，纯 CSS，无外部素材）
 *
 * 这个皮肤演示最简形态：只给 tokens，不给装饰层。
 * token 写成 { light, dark } 对，就会跟随应用当前的明暗设置切换。
 */
;(function (window) {
  'use strict';

  var sheets = window.__DSH_SKIN_SHEETS__ || {};
  var sheet = sheets.paperInk || {};

  // 把两套调色板合并成 { token: { light, dark } } 对。
  var tokens = {};
  Object.keys(sheet.light || {}).forEach(function (k) {
    tokens[k] = { light: sheet.light[k], dark: (sheet.dark || {})[k] };
  });
  Object.keys(sheet.dark || {}).forEach(function (k) {
    if (!tokens[k]) tokens[k] = { light: (sheet.light || {})[k], dark: sheet.dark[k] };
    else tokens[k].dark = sheet.dark[k];
  });

  // 缺一侧的用另一侧补上，避免出现 undefined 把 token 弄成空值。
  Object.keys(tokens).forEach(function (k) {
    if (tokens[k].light === undefined) tokens[k].light = tokens[k].dark;
    if (tokens[k].dark === undefined) tokens[k].dark = tokens[k].light;
  });

  window.__DSH_SKINS__['paper-ink'] = {
    id: 'paper-ink',
    label: '纸白纸墨',
    hint: '米白纸面 + 靛蓝墨 · 跟随明暗',
    swatch: ['#faf7ef', '#1b365d', '#c0392b', '#2b2b2b'],
    tokens: tokens,
    css: {
      '*': function () {
        return [
          '/* 纸白纸墨：给页面加一层极淡的纸纹，纯 CSS，无外部图片 */',
          'body::before {',
          '  content: "";',
          '  position: fixed; inset: 0;',
          '  z-index: -1; pointer-events: none;',
          '  opacity: .5;',
          '  background-image:',
          '    repeating-linear-gradient(0deg, rgba(27,54,93,.030) 0 1px, transparent 1px 3px),',
          '    repeating-linear-gradient(90deg, rgba(27,54,93,.022) 0 1px, transparent 1px 4px);',
          '}',
          '/* 标题用衬线，正文保持无衬线 */',
          '[class*="markdown"] h1, [class*="markdown"] h2, [class*="markdown"] h3 {',
          '  font-family: Georgia, "Songti SC", "Noto Serif SC", serif;',
          '  letter-spacing: .01em;',
          '}',
          '@media (prefers-reduced-motion: reduce) {',
          '  body::before { background-image: none; }',
          '}',
        ].join('\n');
      },
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
