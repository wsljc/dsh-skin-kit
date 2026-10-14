/**
 * P5R 漫画皮肤 · token 调色板
 *
 * P5R 红黑黄纸白四色，以及把它们落到 DSH 官方 token 上的两套调色板
 * （全彩基础版 + 「朴素」灰阶补丁）。
 *
 * 约定：
 *   * 只覆写「有意义」的 token。未列出的保持官方默认 —— 官方文档明确说
 *     第三方覆写集没有完整性校验，列太多反而容易把界面弄花。
 *   * 不写任何组件类名。官方 UI 的类名是编译产物里的哈希名
 *     （BynINW_frame 这种），写它们升级必失效；配色全走 token 才稳。
 */
;(function (window) {
  'use strict';

  // ── P5R 四色 ──────────────────────────────────────────────────────────
  var RED = '#e60012';
  var RED_DEEP = '#b8000e';
  var RED_BRIGHT = '#ff1a2e';
  var BLACK = '#0b0b0e';
  var PAPER = '#fffdf4';
  var YELLOW = '#ffd800';
  var YELLOW_DIM = '#e6c200';

  // 深色底上的层级：漫画黑的三级递进
  var L1 = '#14141a';
  var L2 = '#1c1c23';
  var L3 = '#26262f';

  var RED_DARK = {
    // 底与层级
    '--dsw-alias-bg-base': BLACK,
    '--dsw-alias-bg-layer-1': L1,
    '--dsw-alias-bg-layer-2': L2,
    '--dsw-alias-bg-layer-3': L3,
    '--dsw-alias-bg-module-platform': L2,
    '--dsw-alias-bg-overlay': L3,
    '--dsw-alias-bg-skeleton': 'rgba(255,253,244,.08)',
    '--dsw-alias-bg-multi-select': 'rgba(230,0,18,.22)',

    // 描边：漫画硬边
    '--dsw-alias-border-l1': 'rgba(255,253,244,.16)',
    '--dsw-alias-border-l2': 'rgba(255,253,244,.22)',
    '--dsw-alias-border-l2-darkmode-thin': 'rgba(255,253,244,.16)',
    '--dsw-alias-border-l3': 'rgba(255,253,244,.30)',
    '--dsw-alias-border-l4': 'rgba(255,253,244,.42)',
    '--dsw-alias-border-inverted': 'rgba(255,253,244,.16)',
    '--dsw-alias-border-inverted2': 'rgba(255,253,244,.22)',

    // 文字
    '--dsw-alias-label-primary': PAPER,
    '--dsw-alias-label-primary-dimmed': 'rgba(255,253,244,.86)',
    '--dsw-alias-label-primary-bluish': PAPER,
    '--dsw-alias-label-primary-inverted': BLACK,
    '--dsw-alias-label-primary-foreground': BLACK,
    '--dsw-alias-label-secondary': 'rgba(255,253,244,.72)',
    '--dsw-alias-label-tertiary': 'rgba(255,253,244,.55)',
    '--dsw-alias-label-caption': 'rgba(255,253,244,.48)',
    '--dsw-alias-label-dimmed': 'rgba(255,253,244,.34)',
    '--dsw-alias-label-shimmer': 'rgba(255,253,244,.45)',
    '--dsw-alias-label-deep-diving': YELLOW,
    '--dsw-alias-label-deep-diving-shimmer': 'rgba(255,216,0,.45)',
    '--dsw-alias-label-document-preview': 'rgba(255,253,244,.86)',

    // 品牌：P5R 红
    '--dsw-alias-brand-primary': RED,
    '--dsw-alias-brand-primary-invert': PAPER,
    '--dsw-alias-brand-primary-new-colorprimary-new-color': RED,
    '--dsw-alias-brand-text': PAPER,

    // 按钮：主按钮红底；浮层按钮深色
    '--dsw-alias-button-primary-fill': RED,
    '--dsw-alias-button-primary-hover': RED_BRIGHT,
    '--dsw-alias-button-primary-dimmed': RED_DEEP,
    '--dsw-alias-button-elevated-fill': L2,
    '--dsw-alias-button-floating-fill': L2,
    '--dsw-alias-button-floating-hover': L3,
    '--dsw-alias-button-contrast-fill': PAPER,
    '--dsw-alias-button-info-fill': YELLOW,
    '--dsw-alias-button-info-hover': YELLOW_DIM,
    '--dsw-alias-button-ghost-active-fill': 'rgba(230,0,18,.20)',
    '--dsw-alias-button-ghost-active-hover': 'rgba(230,0,18,.30)',
    '--dsw-alias-button-ghost-active-border': RED,
    '--dsw-alias-button-tool-bar-fill': 'rgba(255,253,244,.06)',
    '--dsw-alias-button-tool-bar-fill-invisible': 'transparent',
    '--dsw-alias-button-tool-bar-hover': 'rgba(230,0,18,.24)',

    // 交互层
    '--dsw-alias-interactive-bg-hover': 'rgba(255,253,244,.08)',
    '--dsw-alias-interactive-bg-active': 'rgba(255,253,244,.14)',
    '--dsw-alias-interactive-bg-hover-accent': 'rgba(230,0,18,.24)',
    '--dsw-alias-interactive-bg-hover-danger': 'rgba(230,0,18,.26)',
    '--dsw-alias-interactive-bg-hover-solid': L3,

    // 链接 / 行内代码 / 代码块
    '--dsw-alias-link': YELLOW,
    '--dsw-alias-markdown-code-block': L1,
    '--dsw-alias-markdown-code-block-banner': L2,
    '--dsw-alias-markdown-inline-code': L3,
    '--dsw-alias-markdown-citation': L2,
    '--dsw-alias-markdown-tag': L2,
    '--dsw-alias-markdown-placeholder': L2,
    '--dsw-alias-markdown-code-segment-selected': L3,
    '--dsw-alias-markdown-code-segment-unselected': L1,

    // 状态色：红黄体系
    '--dsw-alias-state-error-primary': RED,
    '--dsw-alias-state-error-secondary': RED_BRIGHT,
    '--dsw-alias-state-success-primary': '#4ea45f',
    '--dsw-alias-state-success-secondary': '#63c176',
    '--dsw-alias-state-success-tertiary': 'rgba(78,164,95,.18)',
    '--dsw-alias-state-warn-primary': YELLOW,
    '--dsw-alias-state-warn-secondary': YELLOW_DIM,
    '--dsw-alias-state-warn-tertiary': 'rgba(255,216,0,.16)',
    '--dsw-alias-state-warn-label': YELLOW,
    '--dsw-alias-state-business-primary': RED,
    '--dsw-alias-state-business-tertiary': 'rgba(230,0,18,.18)',
    '--dsw-alias-state-idle-primary': 'rgba(255,253,244,.42)',

    // 滚动条：红滑块
    '--dsw-alias-scrollbar-bg-l1': 'rgba(230,0,18,.55)',
    '--dsw-alias-scrollbar-bg-l2': 'rgba(230,0,18,.65)',
    '--dsw-alias-scrollbar-hover-l1': RED,
    '--dsw-alias-scrollbar-hover-l2': RED_BRIGHT,

    // 浮层 / 菜单 / 提示
    '--dsw-alias-menu-group-header-fill': 'rgba(11,11,14,.94)',
    '--dsw-alias-menu-icon': PAPER,
    '--dsw-alias-toast-bg': YELLOW,
    '--dsw-alias-toast-label': BLACK,
    '--dsw-alias-tooltip-bg': L3,
    '--dsw-alias-tooltip-key-bg': 'rgba(255,253,244,.16)',
    '--dsw-alias-turn-trigger-bg': L1,
    '--dsw-alias-turn-trigger-bg-hover': L3,

    // 其它
    '--dsw-alias-switch-thumb': PAPER,
    '--dsw-alias-bg-document-preview': L1,
    '--dsw-alias-bg-document-selection': 'rgba(230,0,18,.40)',
    '--dsw-alias-onboarding-accent': RED,
    '--dsw-alias-onboarding-card-fill': 'rgba(20,20,26,.80)',
    '--dsw-alias-onboarding-secondary-fill': L2,
    '--dsw-alias-onboarding-checkbox-border': 'rgba(255,253,244,.24)',

    // 圆角：漫画风收得更硬
    '--dsw-radius-xs': '2px',
    '--dsw-radius-sm': '4px',
    '--dsw-radius-md': '6px',
    '--dsw-radius-lg': '8px',
    '--dsw-radius-xl': '10px',
    '--dsw-radius-panel': '14px',

    // 投影：硬影（零模糊）—— P5R 的贴纸规则
    '--dsw-elevation-stroke-color': 'rgba(255,253,244,.30)',
    '--dsw-elevation-panel': '4px 4px 0 rgba(255,253,244,.30)',
    '--dsw-elevation-prominent': '6px 6px 0 rgba(255,253,244,.34)',
    '--dsw-elevation-soft': '5px 5px 0 rgba(255,253,244,.26)',
    '--dsw-shadow-lv1': '3px 3px 0 rgba(255,253,244,.26)',
    '--dsw-shadow-lv1-blur': '4px 4px 0 rgba(255,253,244,.22)',
    '--dsw-shadow-lv2': '5px 5px 0 rgba(255,253,244,.28)',
    '--dsw-shadow-lv3': '7px 7px 0 rgba(255,253,244,.30)',

    // 焦点环：红
    '--dsw-focus-ring-color': RED,
  };
  // ── 「朴素」档位：强调色全部转灰阶、去掉投影 ────────────────────────
  // 保留「朴素」的阅读意图：不花哨、不抢注意力。
  var GRAY = '#9aa0a8';
  var GRAY_PATCH = {
    '--dsw-alias-brand-primary': GRAY,
    '--dsw-alias-brand-primary-new-colorprimary-new-color': GRAY,
    '--dsw-alias-button-primary-fill': GRAY,
    '--dsw-alias-button-primary-hover': '#aab0b8',
    '--dsw-alias-button-primary-dimmed': '#7d838b',
    '--dsw-alias-button-info-fill': GRAY,
    '--dsw-alias-button-info-hover': '#aab0b8',
    '--dsw-alias-button-ghost-active-border': GRAY,
    '--dsw-alias-link': GRAY,
    '--dsw-alias-state-business-primary': GRAY,
    '--dsw-alias-state-business-tertiary': 'rgba(154,160,168,.18)',
    '--dsw-alias-state-error-primary': '#c07a7a',
    '--dsw-alias-state-error-secondary': '#cf8f8f',
    '--dsw-alias-state-warn-primary': '#b3ab8a',
    '--dsw-alias-state-warn-secondary': '#c4bd9d',
    '--dsw-alias-state-warn-label': '#b3ab8a',
    '--dsw-alias-label-deep-diving': GRAY,
    '--dsw-alias-label-deep-diving-shimmer': 'rgba(154,160,168,.40)',
    '--dsw-alias-scrollbar-bg-l1': 'rgba(154,160,168,.45)',
    '--dsw-alias-scrollbar-bg-l2': 'rgba(154,160,168,.55)',
    '--dsw-alias-scrollbar-hover-l1': GRAY,
    '--dsw-alias-scrollbar-hover-l2': '#aab0b8',
    '--dsw-alias-onboarding-accent': GRAY,
    '--dsw-alias-bg-document-selection': 'rgba(154,160,168,.32)',
    '--dsw-alias-toast-bg': '#2a2d33',
    '--dsw-alias-toast-label': '#f0f0f0',
    '--dsw-focus-ring-color': GRAY,
    // 去投影：朴素档位不留硬影
    '--dsw-elevation-panel': 'none',
    '--dsw-elevation-prominent': 'none',
    '--dsw-elevation-soft': 'none',
    '--dsw-shadow-lv1': 'none',
    '--dsw-shadow-lv1-blur': 'none',
    '--dsw-shadow-lv2': 'none',
    '--dsw-shadow-lv3': 'none',
  };

  var NS = (window.__DSH_SKIN_SHEETS__ = window.__DSH_SKIN_SHEETS__ || {});
  NS.p5r = {
    colors: {
      RED: RED,
      RED_DEEP: RED_DEEP,
      RED_BRIGHT: RED_BRIGHT,
      BLACK: BLACK,
      PAPER: PAPER,
      YELLOW: YELLOW,
      YELLOW_DIM: YELLOW_DIM,
      L1: L1,
      L2: L2,
      L3: L3,
    },
    base: RED_DARK,
    plainPatch: GRAY_PATCH,
  };
})(typeof window !== 'undefined' ? window : globalThis);
