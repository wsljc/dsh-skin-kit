/**
 * dsh-skin-kit · 皮肤引擎
 * ---------------------------------------------------------------------------
 * 本文件是「脚本块」，不是 ES 模块 —— 它会被 tools/build.mjs 原样拼进
 * client.js 的 factory 函数体里，所以不能用 import / export。
 *
 * 引擎只做四件事：
 *   1. 把皮肤声明的 token 叠到「当前激活主题」之上（overrideTokens）；
 *   2. 按需注入皮肤自带的装饰 CSS 与装饰 DOM；
 *   3. 记住用户选择（localStorage）；
 *   4. 提供设置行组件。
 *
 * 关键设计：**不注册主题、不改 preference**，只叠覆盖层。
 * 原因是实测 dsh-catppuccin 这类插件会在 theme/change 里把 preference
 * 抢回它自己的 flavor，导致刚设的主题立刻被顶掉；而 overrideTokens 的层
 * 按 seq 叠加、后叠者胜，不参与 preference 争夺，谁也抢不走。
 */
(function (window) {
  'use strict';

  var ENGINE_VERSION = '1.0.0';
  var ENGINE_ID = 'dsh-skin-kit';

  var KEY_ACTIVE = 'dsh.skin.active';
  var KEY_DECOR = 'dsh.skin.decor';
  var KEY_VARIANT = 'dsh.skin.variant.';

  var CSS_ATTR = 'data-skin-kit-css';
  var DOM_ID_PREFIX = 'dsh-skin-kit-dom-';

  // ── 命名空间初始化 ────────────────────────────────────────────────────
  // 引擎最先加载，由它开好四个容器，后面的块往里注册：
  //   __DSH_SKIN_ASSETS__ —— 构建期内嵌的 data URI 图片
  //   __DSH_SKIN_SHEETS__ —— 各皮肤的 token 调色板
  //   __DSH_SKIN_DECOR__  —— 各皮肤的装饰 CSS / DOM 构造器
  //   __DSH_SKINS__       —— 皮肤定义（引擎最终读这个）
  ['__DSH_SKIN_ASSETS__', '__DSH_SKIN_SHEETS__', '__DSH_SKIN_DECOR__', '__DSH_SKINS__'].forEach(function (ns) {
    if (!window[ns]) {
      Object.defineProperty(window, ns, { value: {}, writable: true, configurable: true });
    }
  });

  // ── 小工具 ────────────────────────────────────────────────────────────
  function readStored(key, fallback) {
    try {
      var v = window.localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  function writeStored(key, value) {
    try {
      if (value === null || value === undefined) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
    } catch (e) {
      /* 隐私模式等场景下写失败不影响本次会话 */
    }
  }

  /**
   * 调色板 → overrideTokens 需要的 { light, dark } 对。
   * 传裸字符串 = 两侧同色（皮肤固定深色时最常用）。
   * 传 { light, dark } = 跟随当前主题的 colorScheme。
   */
  function toPairs(palette) {
    var out = {};
    Object.keys(palette || {}).forEach(function (name) {
      var v = palette[name];
      if (v && typeof v === 'object' && (v.light !== undefined || v.dark !== undefined)) {
        out[name] = {
          light: v.light === undefined ? v.dark : v.light,
          dark: v.dark === undefined ? v.light : v.dark,
        };
      } else {
        out[name] = { light: v, dark: v };
      }
    });
    return out;
  }

  /** 合并基础调色板与档位补丁，得到某一档位实际生效的 token 集。 */
  function paletteFor(skin, variantId) {
    var merged = {};
    var base = skin.tokens || {};
    Object.keys(base).forEach(function (k) {
      merged[k] = base[k];
    });
    var variant = variantId && skin.variants ? skin.variants[variantId] : null;
    if (variant && variant.tokens) {
      Object.keys(variant.tokens).forEach(function (k) {
        merged[k] = variant.tokens[k];
      });
    }
    return merged;
  }

  function variantIds(skin) {
    return skin.variants ? Object.keys(skin.variants) : [];
  }

  /** 档位 id → 该档位的装饰 CSS 文本（皮肤可用函数按需生成）。 */
  function cssFor(skin, variantId) {
    var map = skin.css;
    if (!map) return '';
    var entry = map[variantId];
    if (entry === undefined) entry = map['*'];
    if (typeof entry === 'function') return entry(skin) || '';
    return entry || '';
  }

  function domFor(skin, variantId) {
    var map = skin.dom;
    if (!map) return null;
    var entry = map[variantId];
    if (entry === undefined) entry = map['*'];
    return typeof entry === 'function' ? entry : null;
  }

  /** 装饰 CSS 的 <style> 标签：一个皮肤一个，幂等替换。 */
  function applyDecorCss(skin, css) {
    if (typeof document === 'undefined') return;
    var sel = 'style[' + CSS_ATTR + '="' + skin.id + '"]';
    var existing = document.querySelector(sel);
    if (!css) {
      if (existing) existing.remove();
      return;
    }
    // 内容没变就不重写：重写 <style> 会让 CSS 动画从头开始（背景漂移会跳帧）。
    if (existing && existing.textContent === css) return;
    var tag = existing || document.createElement('style');
    tag.setAttribute(CSS_ATTR, skin.id);
    tag.setAttribute('data-plugin', ENGINE_ID);
    tag.textContent = css;
    if (!existing) document.head.appendChild(tag);
  }

  /** 装饰 DOM：一个皮肤一个挂载点，幂等替换（已存在且同皮肤就不重建）。 */
  function applyDecorDom(skin, variantId) {
    if (typeof document === 'undefined') return;
    var host = document.getElementById(DOM_ID_PREFIX + skin.id);
    var build = domFor(skin, variantId);
    if (!build) {
      if (host) host.remove();
      return;
    }
    // 已经挂好且档位没变，就原样留着，避免每次 theme/change 都重建动画。
    if (host && host.getAttribute('data-variant') === String(variantId)) return;
    if (host) host.remove();
    var node = null;
    try {
      node = build(skin, variantId);
    } catch (e) {
      if (window.console && window.console.warn) {
        window.console.warn('[dsh-skin-kit] 皮肤 ' + skin.id + ' 的装饰 DOM 构建失败', e);
      }
      return;
    }
    if (!node) return;
    node.id = DOM_ID_PREFIX + skin.id;
    node.setAttribute('data-plugin', ENGINE_ID);
    node.setAttribute('data-variant', String(variantId));
    node.setAttribute('aria-hidden', 'true');
    document.body.appendChild(node);
  }

  function removeDecor(skin) {
    applyDecorCss(skin, '');
    if (typeof document === 'undefined') return;
    var host = document.getElementById(DOM_ID_PREFIX + skin.id);
    if (host) host.remove();
  }
  // ── 状态机：当前皮肤 / 档位 / 装饰开关 ────────────────────────────────
  /**
   * @param {object} ctx   插件上下文
   * @param {object} skins 皮肤注册表：{ id: skin }
   */
  function createRenderer(ctx, skins) {
    var theme = ctx.get('theme');
    var listeners = new Set();
    var activeDispose = null;

    var ids = Object.keys(skins);
    var fallbackId = null;
    for (var i = 0; i < ids.length; i++) {
      if (skins[ids[i]].default) { fallbackId = ids[i]; break; }
    }
    if (!fallbackId) fallbackId = ids.length ? ids[0] : null;

    var stored = readStored(KEY_ACTIVE, null);
    // 'off' 与 null 都表示「关掉皮肤，回到主题原貌」；只有存在于注册表的 id 才认。
    var active = stored && skins[stored] ? stored : null;
    if (stored === null) active = fallbackId;
    var decorOn = readStored(KEY_DECOR, 'on') !== 'off';

    /** 档位记忆：没记过就用皮肤的 defaultVariant，再退回第一个。 */
    function variantOf(id) {
      var skin = skins[id];
      if (!skin) return null;
      var list = variantIds(skin);
      if (!list.length) return null;
      var remembered = readStored(KEY_VARIANT + id, null);
      if (remembered && list.indexOf(remembered) !== -1) return remembered;
      if (skin.defaultVariant && list.indexOf(skin.defaultVariant) !== -1) return skin.defaultVariant;
      return list[0];
    }

    var variants = {};
    ids.forEach(function (id) {
      variants[id] = variantOf(id);
    });
    /** 档位表在 setVariant 里整体替换，所以这里用 var + 重新赋值（不是 const）。 */

    /** 上一次投影过的皮肤 id：用来撤掉它的装饰层（每个皮肤按自己的 id 挂）。 */
    var previousId = null;

    function emit() {
      listeners.forEach(function (l) {
        try {
          l();
        } catch (e) {
          /* 单个订阅者出错不影响其它订阅者 */
        }
      });
    }

    /**
     * 把当前选择投影到 token 覆盖层 + 装饰层上。幂等，可反复调用。
     *
     * 注意这里必须**先撤掉上一个皮肤的装饰**：每个皮肤的 CSS / DOM 是按
     * 自己的 id 挂的，只处理新皮肤会留下旧皮肤的背景图与装饰 DOM。
     */
    function sync() {
      try {
        if (activeDispose) activeDispose();
      } catch (e) {
        /* 旧层撤不掉也不能挡住新层 */
      }
      activeDispose = null;

      if (previousId && previousId !== active) {
        removeDecor(skins[previousId]);
      }

      if (!active) {
        previousId = null;
        return;
      }

      var skin = skins[active];
      var variant = variants[active];

      activeDispose = theme.overrideTokens('skin:' + skin.id, toPairs(paletteFor(skin, variant)));
      applyDecorCss(skin, decorOn ? cssFor(skin, variant) : '');
      if (decorOn) {
        applyDecorDom(skin, variant);
      } else {
        var host =
          typeof document === 'undefined' ? null : document.getElementById(DOM_ID_PREFIX + skin.id);
        if (host) host.remove();
      }
      previousId = active;
    }

    /**
     * 设置行用的快照。
     *
     * ⚠️ 必须是**稳定引用**：useSyncExternalStore 会拿 getSnapshot 的返回值做
     * Object.is 比较，每次 new 一个对象会被判定为「一直在变」，React 抛
     * error #185（无限重渲染）。所以这里缓存一份，只在状态真的变了才换新对象。
     */
    var snapshotCache = null;
    function buildSnapshot() {
      var next = { active: active, decor: decorOn, variants: variants };
      if (snapshotCache === null) {
        snapshotCache = next;
        return snapshotCache;
      }
      var same =
        snapshotCache.active === next.active &&
        snapshotCache.decor === next.decor &&
        Object.keys(next.variants).length === Object.keys(snapshotCache.variants).length &&
        Object.keys(next.variants).every(function (k) {
          return snapshotCache.variants[k] === next.variants[k];
        });
      if (!same) snapshotCache = next;
      return snapshotCache;
    }

    return {
      skins: skins,
      /** 完整投影：撤旧层 → 叠 token 层 → 投装饰层。只在用户改选择时调用。 */
      sync: sync,
      subscribe: function (listener) {
        listeners.add(listener);
        return function () {
          listeners.delete(listener);
        };
      },
      /** 设置行用的快照（稳定引用，见上）。 */
      snapshot: buildSnapshot,
      /** 选皮肤；再点一次当前皮肤 = 关闭（撤层，回到主题原貌）。 */
      select: function (id) {
        var next = id === active ? null : id;
        active = next;
        writeStored(KEY_ACTIVE, next === null ? 'off' : next);
        emit();
        sync();
      },
      setVariant: function (id, variant) {
        if (!skins[id]) return;
        // 换新对象而不是原地改：快照缓存靠引用比较，原地改会漏掉这次变化。
        variants = Object.assign({}, variants, { [id]: variant });
        writeStored(KEY_VARIANT + id, variant);
        emit();
        if (active === id) sync();
      },
      setDecor: function (on) {
        decorOn = !!on;
        writeStored(KEY_DECOR, decorOn ? 'on' : 'off');
        emit();
        sync();
      },
      /**
       * 主题变化（明暗切换 / 第三方主题 / 别的插件叠层）后重投**装饰层**。
       *
       * ⚠️ 这里绝对不能调 overrideTokens：官方 publish() 是无条件发
       * `theme/change` 的，而 overrideTokens 内部就会 publish()。
       * 在 theme/change 里再叠层 → 事件套事件，直接把页面转死（实测会卡住
       * 渲染、截图都拿不到新帧）。token 层只在用户改选择时才动。
       */
      resync: function () {
        if (!active) return;
        var skin = skins[active];
        var variant = variants[active];
        applyDecorCss(skin, decorOn ? cssFor(skin, variant) : '');
        if (decorOn) applyDecorDom(skin, variant);
      },
      dispose: function () {
        try {
          if (activeDispose) activeDispose();
        } catch (e) {
          /* 忽略 */
        }
        activeDispose = null;
        ids.forEach(removeDecor);
      },
    };
  }

  // ── 设置行组件 ────────────────────────────────────────────────────────
  /**
   * 造设置行组件。react 由 factory 注入（客户端 bundle 里 react 是外部的）。
   *
   * 注意 props 的取法：slots.register 的 inject 是**返回 props 的函数**，
   * 组件里用 react.useSyncExternalStore(subscribe, snapshot) 订阅。
   */
  function makeSettingsRow(react) {
    var h = react.createElement;

    var S = {
      group: { display: 'flex', flexDirection: 'column', gap: 10 },
      title: { fontSize: 14, fontWeight: 400, color: 'var(--dsw-alias-label-primary)', lineHeight: '22px' },
      desc: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)', lineHeight: '18px' },
      row: { display: 'flex', flexWrap: 'wrap', gap: 8 },
      cube: {
        flex: '1 1 150px',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        alignItems: 'flex-start',
        padding: '12px 16px',
        border: '1px solid var(--dsw-alias-border-l2)',
        borderRadius: 'var(--dsw-radius-lg, 8px)',
        background: 'transparent',
        color: 'var(--dsw-alias-label-primary)',
        cursor: 'pointer',
        font: 'inherit',
        fontSize: 13,
        textAlign: 'left',
      },
      cubeOn: {
        borderColor: 'var(--dsw-alias-brand-primary)',
        boxShadow: '3px 3px 0 var(--dsw-alias-border-l4)',
      },
      swatch: { display: 'inline-flex', gap: 3, marginBottom: 2 },
      chip: { width: 12, height: 12, display: 'inline-block', border: '1px solid rgba(128,128,128,.5)' },
      hint: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' },
      toggleRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        color: 'var(--dsw-alias-label-secondary)',
      },
      variantRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
      variantBtn: {
        padding: '4px 10px',
        border: '1px solid var(--dsw-alias-border-l2)',
        borderRadius: 'var(--dsw-radius-sm, 4px)',
        background: 'transparent',
        color: 'var(--dsw-alias-label-secondary)',
        cursor: 'pointer',
        font: 'inherit',
        fontSize: 12,
      },
      variantBtnOn: {
        borderColor: 'var(--dsw-alias-brand-primary)',
        color: 'var(--dsw-alias-label-primary)',
      },
    };

    return function SkinSettingsRow(props) {
      var state = react.useSyncExternalStore(props.subscribe, props.snapshot);
      var skins = props.skins;
      var active = state.active;
      var variant = active ? state.variants[active] : null;
      var ids = Object.keys(skins);

      var cubes = ids.map(function (id) {
        var info = skins[id];
        var swatch = info.swatch || [];
        return h(
          'button',
          {
            key: id,
            type: 'button',
            style: active === id ? Object.assign({}, S.cube, S.cubeOn) : S.cube,
            onClick: function () {
              props.select(id);
            },
            'aria-pressed': active === id,
          },
          swatch.length
            ? h(
                'span',
                { style: S.swatch },
                swatch.map(function (c, i) {
                  return h('i', { key: i, style: Object.assign({}, S.chip, { background: c }) });
                }),
              )
            : null,
          h('b', null, info.label || id),
          info.hint ? h('span', { style: S.hint }, info.hint) : null,
        );
      });

      var activeSkin = active ? skins[active] : null;
      var variantNames = activeSkin && activeSkin.variants ? Object.keys(activeSkin.variants) : [];
      var variantBtns =
        variantNames.length > 1
          ? h(
              'div',
              { style: S.variantRow },
              variantNames.map(function (vname) {
                return h(
                  'button',
                  {
                    key: vname,
                    type: 'button',
                    style: variant === vname ? Object.assign({}, S.variantBtn, S.variantBtnOn) : S.variantBtn,
                    onClick: function () {
                      props.setVariant(active, vname);
                    },
                  },
                  activeSkin.variants[vname].label || vname,
                );
              }),
            )
          : null;

      return h(
        'div',
        { style: S.group },
        h('div', { style: S.title }, '皮肤'),
        h(
          'div',
          { style: S.desc },
          '以 token 覆盖层叠加在当前主题之上：不注册主题、不改主题偏好，因此与内置明暗和任何第三方主题都能共存。再点一次已选中的皮肤即可关闭。',
        ),
        h('div', { style: S.row }, cubes),
        variantBtns,
        h(
          'label',
          { style: S.toggleRow },
          h('input', {
            type: 'checkbox',
            checked: state.decor,
            onChange: function (e) {
              props.setDecor(e.target.checked);
            },
          }),
          '装饰层（皮肤自带的背景图、斜条纹、漫画按键等 CSS 与 DOM 装饰）',
        ),
        h(
          'div',
          { style: S.hint },
          '选择记录在浏览器 localStorage（dsh.skin.*），不写入宿主设置 —— 宿主主题 schema 只认 light / dark / system。',
        ),
      );
    };
  }

  // ── 插件入口 ──────────────────────────────────────────────────────────
  /**
   * 用一份皮肤注册表造一个 DSH 客户端插件。
   *
   * @param {object} skins 皮肤注册表：{ id: skin }；皮肤本身是个纯数据对象。
   * @param {object} react 由 client bundle 的 factory 从 require('react') 传入。
   * @returns {{name: string, inject: string[], apply: Function}}
   */
  function createPlugin(skins, react) {
    function apply(ctx) {
      var renderer = createRenderer(ctx, skins);
      var Row = makeSettingsRow(react);

      ctx.effect(function () {
        // 首次挂载：完整投影一次（叠 token 层 + 装饰层）。
        renderer.sync();
        // 之后主题变化只重投装饰层 —— 见 resync 的注释，这里再叠 token 层会死循环。
        var off = ctx.on('theme/change', function () {
          renderer.resync();
        });
        return function () {
          if (off) off();
          renderer.dispose();
        };
      }, 'skin-kit: token layer + decor');

      // 设置行挂在「插件市场 → 本插件 → 配置」卡片里。
      // 实测：settings.general.item 在当前版本（0.2.0-rc.2）不渲染，
      // 而 plugins.bundle.config 是可用的配置挂载点（dsh-reasoning-per-model
      // 也用它）。两个都注册，谁存在谁生效。
      ['plugins.bundle.config', 'settings.general.item'].forEach(function (slot) {
        try {
          ctx.slots.inject(slot, function () {
            return ctx.slots.register(
              {
                name: slot,
                id: ENGINE_ID,
                key: ENGINE_ID,
                order: 22,
                inject: function () {
                  return {
                    skins: renderer.skins,
                    subscribe: renderer.subscribe,
                    snapshot: renderer.snapshot,
                    select: renderer.select,
                    setVariant: renderer.setVariant,
                    setDecor: renderer.setDecor,
                  };
                },
              },
              Row,
            );
          });
        } catch (e) {
          /* 该 slot 在当前版本不存在就跳过 */
        }
      });
    }

    return { name: ENGINE_ID, inject: ['slots', 'theme'], apply: apply };
  }

  // ── 导出（供 bundle 的 factory 取用）──────────────────────────────────
  window.__DSH_SKIN_KIT__ = {
    version: ENGINE_VERSION,
    toPairs: toPairs,
    paletteFor: paletteFor,
    createRenderer: createRenderer,
    makeSettingsRow: makeSettingsRow,
    createPlugin: createPlugin,
  };
})(typeof window !== 'undefined' ? window : globalThis);
