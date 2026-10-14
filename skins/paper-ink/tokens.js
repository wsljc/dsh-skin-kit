/**
 * 纸白纸墨 · token 调色板（示例皮肤：明暗自适应）
 * 米白纸面 + 靛蓝墨，纯 CSS 派生，不含任何外部素材。
 */
;(function (window) {
  'use strict';

  var PAPER_DARK = {
    '--dsw-alias-bg-base': '#12161d',
    '--dsw-alias-bg-layer-1': '#171c25',
    '--dsw-alias-bg-layer-2': '#1d232e',
    '--dsw-alias-bg-layer-3': '#242b38',
    '--dsw-alias-bg-module-platform': '#1d232e',
    '--dsw-alias-bg-overlay': '#242b38',

    '--dsw-alias-border-l1': 'rgba(233,226,209,.14)',
    '--dsw-alias-border-l2': 'rgba(233,226,209,.22)',
    '--dsw-alias-border-l2-darkmode-thin': 'rgba(233,226,209,.14)',
    '--dsw-alias-border-l3': 'rgba(233,226,209,.30)',
    '--dsw-alias-border-l4': 'rgba(233,226,209,.42)',

    '--dsw-alias-label-primary': '#f0ead9',
    '--dsw-alias-label-primary-dimmed': 'rgba(240,234,217,.86)',
    '--dsw-alias-label-primary-inverted': '#1b365d',
    '--dsw-alias-label-primary-foreground': '#0f1c30',
    '--dsw-alias-label-secondary': 'rgba(240,234,217,.72)',
    '--dsw-alias-label-tertiary': 'rgba(240,234,217,.55)',

    '--dsw-alias-brand-primary': '#3f6bb5',
    '--dsw-alias-brand-primary-invert': '#f0ead9',
    '--dsw-alias-brand-text': '#f0ead9',
    '--dsw-alias-button-primary-fill': '#1b365d',
    '--dsw-alias-button-primary-hover': '#24487a',
    '--dsw-alias-button-primary-dimmed': '#152b4b',
    '--dsw-alias-button-elevated-fill': '#242b38',
    '--dsw-alias-button-floating-fill': '#242b38',
    '--dsw-alias-button-floating-hover': '#2b3444',
    '--dsw-alias-button-contrast-fill': '#f0ead9',
    '--dsw-alias-button-info-fill': '#c0392b',
    '--dsw-alias-button-info-hover': '#d04a3c',

    '--dsw-alias-link': '#6d9bdc',
    '--dsw-alias-markdown-code-block': '#171c25',
    '--dsw-alias-markdown-code-block-banner': '#1d232e',
    '--dsw-alias-markdown-inline-code': '#242b38',
    '--dsw-alias-markdown-citation': '#1d232e',

    '--dsw-alias-state-error-primary': '#c0392b',
    '--dsw-alias-state-success-primary': '#3f8f5c',
    '--dsw-alias-state-warn-primary': '#b8860b',

    '--dsw-alias-scrollbar-bg-l1': 'rgba(63,107,181,.55)',
    '--dsw-alias-scrollbar-bg-l2': 'rgba(63,107,181,.65)',
    '--dsw-alias-scrollbar-hover-l1': '#3f6bb5',
    '--dsw-alias-scrollbar-hover-l2': '#6d9bdc',

    '--dsw-alias-toast-bg': '#f0ead9',
    '--dsw-alias-toast-label': '#12161d',
    '--dsw-alias-tooltip-bg': '#242b38',
    '--dsw-alias-menu-group-header-fill': 'rgba(18,22,29,.94)',

    '--dsw-radius-xs': '2px',
    '--dsw-radius-sm': '4px',
    '--dsw-radius-md': '6px',
    '--dsw-radius-lg': '10px',
    '--dsw-radius-xl': '14px',
    '--dsw-radius-panel': '18px',

    '--dsw-elevation-panel': '0 6px 18px rgba(0,0,0,.42)',
    '--dsw-elevation-prominent': '0 10px 28px rgba(0,0,0,.50)',
    '--dsw-elevation-soft': '0 2px 8px rgba(0,0,0,.30)',
    '--dsw-shadow-lv1': '0 2px 6px rgba(0,0,0,.32)',
    '--dsw-shadow-lv2': '0 8px 22px rgba(0,0,0,.42)',
    '--dsw-shadow-lv3': '0 14px 36px rgba(0,0,0,.48)',

    '--dsw-focus-ring-color': '#6d9bdc',
  };

  var PAPER_LIGHT = {
    '--dsw-alias-bg-base': '#faf7ef',
    '--dsw-alias-bg-layer-1': '#f4f0e6',
    '--dsw-alias-bg-layer-2': '#ede7da',
    '--dsw-alias-bg-layer-3': '#e4dccc',
    '--dsw-alias-bg-module-platform': '#ede7da',
    '--dsw-alias-bg-overlay': '#e4dccc',

    '--dsw-alias-border-l1': 'rgba(27,54,93,.12)',
    '--dsw-alias-border-l2': 'rgba(27,54,93,.18)',
    '--dsw-alias-border-l2-darkmode-thin': 'rgba(27,54,93,.12)',
    '--dsw-alias-border-l3': 'rgba(27,54,93,.26)',
    '--dsw-alias-border-l4': 'rgba(27,54,93,.38)',

    '--dsw-alias-label-primary': '#1b2733',
    '--dsw-alias-label-primary-dimmed': 'rgba(27,39,51,.86)',
    '--dsw-alias-label-primary-inverted': '#faf7ef',
    '--dsw-alias-label-primary-foreground': '#faf7ef',
    '--dsw-alias-label-secondary': 'rgba(27,39,51,.68)',
    '--dsw-alias-label-tertiary': 'rgba(27,39,51,.52)',

    '--dsw-alias-brand-primary': '#1b365d',
    '--dsw-alias-brand-primary-invert': '#faf7ef',
    '--dsw-alias-brand-text': '#faf7ef',
    '--dsw-alias-button-primary-fill': '#1b365d',
    '--dsw-alias-button-primary-hover': '#24487a',
    '--dsw-alias-button-primary-dimmed': '#152b4b',
    '--dsw-alias-button-elevated-fill': '#ede7da',
    '--dsw-alias-button-floating-fill': '#f4f0e6',
    '--dsw-alias-button-floating-hover': '#e4dccc',
    '--dsw-alias-button-contrast-fill': '#1b365d',
    '--dsw-alias-button-info-fill': '#c0392b',
    '--dsw-alias-button-info-hover': '#a93226',

    '--dsw-alias-link': '#2a5290',
    '--dsw-alias-markdown-code-block': '#f4f0e6',
    '--dsw-alias-markdown-code-block-banner': '#ede7da',
    '--dsw-alias-markdown-inline-code': '#e4dccc',
    '--dsw-alias-markdown-citation': '#ede7da',

    '--dsw-alias-state-error-primary': '#c0392b',
    '--dsw-alias-state-success-primary': '#2f7a4a',
    '--dsw-alias-state-warn-primary': '#9a6b00',

    '--dsw-alias-scrollbar-bg-l1': 'rgba(27,54,93,.28)',
    '--dsw-alias-scrollbar-bg-l2': 'rgba(27,54,93,.38)',
    '--dsw-alias-scrollbar-hover-l1': '#1b365d',
    '--dsw-alias-scrollbar-hover-l2': '#2a5290',

    '--dsw-alias-toast-bg': '#1b2733',
    '--dsw-alias-toast-label': '#faf7ef',
    '--dsw-alias-tooltip-bg': '#e4dccc',
    '--dsw-alias-menu-group-header-fill': 'rgba(250,247,239,.96)',

    '--dsw-radius-xs': '2px',
    '--dsw-radius-sm': '4px',
    '--dsw-radius-md': '6px',
    '--dsw-radius-lg': '10px',
    '--dsw-radius-xl': '14px',
    '--dsw-radius-panel': '18px',

    '--dsw-elevation-panel': '0 4px 14px rgba(27,39,51,.10)',
    '--dsw-elevation-prominent': '0 8px 24px rgba(27,39,51,.14)',
    '--dsw-elevation-soft': '0 1px 4px rgba(27,39,51,.08)',
    '--dsw-shadow-lv1': '0 1px 3px rgba(27,39,51,.10)',
    '--dsw-shadow-lv2': '0 6px 16px rgba(27,39,51,.12)',
    '--dsw-shadow-lv3': '0 12px 30px rgba(27,39,51,.16)',

    '--dsw-focus-ring-color': '#2a5290',
  };

  var NS = (window.__DSH_SKIN_SHEETS__ = window.__DSH_SKIN_SHEETS__ || {});
  NS.paperInk = { light: PAPER_LIGHT, dark: PAPER_DARK };
})(typeof window !== 'undefined' ? window : globalThis);
