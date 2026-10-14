/**
 * 终端绿 · token 调色板（示例皮肤：固定深色）
 * 黑底荧光绿，纯 CSS 派生，不含任何外部素材。
 */
;(function (window) {
  'use strict';

  var BASE = {
    '--dsw-alias-bg-base': '#080c08',
    '--dsw-alias-bg-layer-1': '#0d130d',
    '--dsw-alias-bg-layer-2': '#121a12',
    '--dsw-alias-bg-layer-3': '#182318',
    '--dsw-alias-bg-module-platform': '#121a12',
    '--dsw-alias-bg-overlay': '#182318',

    '--dsw-alias-border-l1': 'rgba(51,255,102,.14)',
    '--dsw-alias-border-l2': 'rgba(51,255,102,.22)',
    '--dsw-alias-border-l2-darkmode-thin': 'rgba(51,255,102,.14)',
    '--dsw-alias-border-l3': 'rgba(51,255,102,.30)',
    '--dsw-alias-border-l4': 'rgba(51,255,102,.42)',

    '--dsw-alias-label-primary': '#c8ffd8',
    '--dsw-alias-label-primary-dimmed': 'rgba(200,255,216,.86)',
    '--dsw-alias-label-primary-inverted': '#080c08',
    '--dsw-alias-label-primary-foreground': '#080c08',
    '--dsw-alias-label-secondary': 'rgba(200,255,216,.70)',
    '--dsw-alias-label-tertiary': 'rgba(200,255,216,.52)',

    '--dsw-alias-brand-primary': '#33ff66',
    '--dsw-alias-brand-primary-invert': '#080c08',
    '--dsw-alias-brand-text': '#080c08',
    '--dsw-alias-button-primary-fill': '#1f8f47',
    '--dsw-alias-button-primary-hover': '#28b058',
    '--dsw-alias-button-primary-dimmed': '#17703a',
    '--dsw-alias-button-elevated-fill': '#121a12',
    '--dsw-alias-button-floating-fill': '#121a12',
    '--dsw-alias-button-floating-hover': '#182318',
    '--dsw-alias-button-contrast-fill': '#c8ffd8',
    '--dsw-alias-button-info-fill': '#2fa36b',
    '--dsw-alias-button-info-hover': '#3ec082',

    '--dsw-alias-link': '#5cff96',
    '--dsw-alias-markdown-code-block': '#0d130d',
    '--dsw-alias-markdown-code-block-banner': '#121a12',
    '--dsw-alias-markdown-inline-code': '#182318',
    '--dsw-alias-markdown-citation': '#121a12',

    '--dsw-alias-state-error-primary': '#ff6b6b',
    '--dsw-alias-state-success-primary': '#33ff66',
    '--dsw-alias-state-warn-primary': '#e8d44d',

    '--dsw-alias-scrollbar-bg-l1': 'rgba(51,255,102,.45)',
    '--dsw-alias-scrollbar-bg-l2': 'rgba(51,255,102,.58)',
    '--dsw-alias-scrollbar-hover-l1': '#33ff66',
    '--dsw-alias-scrollbar-hover-l2': '#5cff96',

    '--dsw-alias-toast-bg': '#0d130d',
    '--dsw-alias-toast-label': '#c8ffd8',
    '--dsw-alias-tooltip-bg': '#182318',
    '--dsw-alias-menu-group-header-fill': 'rgba(8,12,8,.94)',

    '--dsw-radius-xs': '0px',
    '--dsw-radius-sm': '2px',
    '--dsw-radius-md': '3px',
    '--dsw-radius-lg': '4px',
    '--dsw-radius-xl': '6px',
    '--dsw-radius-panel': '8px',

    // 终端感：零模糊的硬影
    '--dsw-elevation-panel': '0 0 0 1px rgba(51,255,102,.24), 4px 4px 0 rgba(0,0,0,.6)',
    '--dsw-elevation-prominent': '0 0 0 1px rgba(51,255,102,.30), 6px 6px 0 rgba(0,0,0,.6)',
    '--dsw-elevation-soft': '0 0 12px rgba(51,255,102,.10)',
    '--dsw-shadow-lv1': '3px 3px 0 rgba(0,0,0,.55)',
    '--dsw-shadow-lv1-blur': '4px 4px 0 rgba(0,0,0,.55)',
    '--dsw-shadow-lv2': '5px 5px 0 rgba(0,0,0,.58)',
    '--dsw-shadow-lv3': '7px 7px 0 rgba(0,0,0,.6)',

    '--dsw-focus-ring-color': '#33ff66',
  };

  var NS = (window.__DSH_SKIN_SHEETS__ = window.__DSH_SKIN_SHEETS__ || {});
  NS.terminalGreen = { flat: BASE };
})(typeof window !== 'undefined' ? window : globalThis);
