/**
 * 皮肤插件的客户端入口。
 *
 * 这里读 window.__DSH_SKINS__（由各皮肤定义在同一个 bundle 里注册好），
 * 交给引擎造插件，然后按 DSH 客户端插件的约定导出 apply / inject。
 *
 * 由 tools/build.mjs 拼进 client.js 的 factory 函数体里，所以不能用
 * import / export —— react 是从 factory 作用域里取的外层变量。
 */
;(function (window) {
  'use strict';

  var skins = window.__DSH_SKINS__ || {};
  var kit = window.__DSH_SKIN_KIT__;

  if (!kit) {
    throw new Error('[dsh-skin-kit] 引擎未加载：构建顺序有误，请重跑 node tools/build.mjs');
  }

  var ids = Object.keys(skins);
  if (!ids.length) {
    throw new Error('[dsh-skin-kit] 皮肤注册表为空：构建顺序有误，请重跑 node tools/build.mjs');
  }

  var plugin = kit.createPlugin(skins, react);

  exports.apply = plugin.apply;
  exports.inject = plugin.inject;

  // 便于在 DevTools 里调试：window.__DSH_SKIN_KIT__.skins
  kit.skins = skins;
  kit.skinIds = ids;
})(typeof window !== 'undefined' ? window : globalThis);
