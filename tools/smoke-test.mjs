/**
 * 无浏览器加载测试：用最小 DOM / window 桩跑一遍 client.js，
 * 验证 bundle 能加载、皮肤注册表完整、插件能 apply。
 *
 * 用法：node tools/smoke-test.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const source = readFileSync(join(root, 'client.js'), 'utf8');

// ── 最小 DOM 桩 ─────────────────────────────────────────────────────────
const headChildren = [];
const bodyChildren = [];

function makeEl(tag) {
  return {
    tagName: String(tag).toUpperCase(),
    id: '',
    className: '',
    innerHTML: '',
    textContent: '',
    children: [],
    attrs: {},
    style: {},
    setAttribute(k, v) {
      this.attrs[k] = v;
    },
    getAttribute(k) {
      return this.attrs[k];
    },
    removeAttribute(k) {
      delete this.attrs[k];
    },
    appendChild(c) {
      this.children.push(c);
      return c;
    },
    remove() {
      const list = this.parentList;
      if (list) {
        const i = list.indexOf(this);
        if (i !== -1) list.splice(i, 1);
      }
    },
    querySelector() {
      return null;
    },
  };
}

const head = makeEl('head');
const body = makeEl('body');
head.children = headChildren;
body.children = bodyChildren;

const documentStub = {
  head,
  body,
  createElement: makeEl,
  getElementById: (id) => [...headChildren, ...bodyChildren].find((n) => n.id === id) || null,
  querySelector: (sel) => {
    const m = /\[data-skin-kit-css="([^"]+)"\]/.exec(sel);
    if (!m) return null;
    return headChildren.find((n) => n.attrs['data-skin-kit-css'] === m[1]) || null;
  },
};

const store = new Map();
const windowStub = {
  document: documentStub,
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
  console,
};
windowStub.window = windowStub;

// ── 收集 ModuleLoader 注册 ──────────────────────────────────────────────
let registered = null;
windowStub.__ModuleLoader__ = {
  load(def) {
    registered = def;
  },
};

// ── 跑 bundle ───────────────────────────────────────────────────────────
const failures = [];
const check = (label, ok, extra = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${label}${extra ? '  ' + extra : ''}`);
  if (!ok) failures.push(label);
};

console.log('加载 client.js …');
try {
  new Function('window', 'document', 'localStorage', 'console', source)(
    windowStub,
    documentStub,
    windowStub.localStorage,
    console,
  );
} catch (e) {
  console.error('✗ bundle 加载抛错：', e.message);
  process.exit(1);
}
check('bundle 加载无异常', true);

check('注册了 ModuleLoader 定义', registered !== null);
check('模块 id 正确', registered && registered.id === 'dsh-skin-kit', registered ? `id=${registered.id}` : '');

// factory 里 require 只能拿到宿主预置包，这里模拟 react。
const fakeReact = {
  createElement: (type, props, ...kids) => ({ type, props, kids }),
  useSyncExternalStore: (subscribe, snapshot) => snapshot(),
};

let mod = null;
try {
  mod = registered.factory((name) => {
    if (name === 'react') return fakeReact;
    throw new Error(`factory 里出现了非预期的 require：${name}`);
  });
} catch (e) {
  console.error('✗ factory 执行抛错：', e.message);
  process.exit(1);
}
check('factory 执行无异常', true);
check('导出 apply', typeof mod.apply === 'function');
check('导出 inject', Array.isArray(mod.inject), JSON.stringify(mod.inject));

const skins = windowStub.__DSH_SKINS__ || {};
const ids = Object.keys(skins);
check('皮肤注册表非空', ids.length > 0, ids.join(', '));
check('P5R 皮肤已注册', !!skins['p5r-comic']);
check('示例皮肤 ≥ 2 个', ids.length >= 3, `共 ${ids.length} 个`);
check('恰好一个默认皮肤', ids.filter((i) => skins[i].default).length === 1);

// ── 造一个假 ctx，跑一遍 apply ─────────────────────────────────────────
const overrides = [];
const handlers = {};
const fakeCtx = {
  get(name) {
    if (name === 'theme') {
      return {
        overrideTokens(source, tokens) {
          overrides.push({ source, count: Object.keys(tokens).length });
          return () => {
            const i = overrides.findIndex((o) => o.source === source);
            if (i !== -1) overrides.splice(i, 1);
          };
        },
      };
    }
    return null;
  },
  effect(fn, label) {
    const cleanup = fn();
    handlers[label] = cleanup;
    return cleanup;
  },
  on(event, fn) {
    handlers['on:' + event] = fn;
    return () => delete handlers['on:' + event];
  },
  slots: {
    inject(slot, fn) {
      fn();
    },
    register(spec, Comp) {
      handlers.rowSpec = spec;
      handlers.Row = Comp;
      return () => {};
    },
  },
};

console.log('\napply(ctx) …');
try {
  mod.apply(fakeCtx);
} catch (e) {
  console.error('✗ apply 抛错：', e.message);
  process.exit(1);
}
check('apply 无异常', true);
check('叠了一层 token 覆盖', overrides.length === 1, JSON.stringify(overrides));
check('覆盖层 token 数合理', overrides[0] && overrides[0].count > 50, `${overrides[0] ? overrides[0].count : 0} 个`);
check('注册了设置行', !!handlers.Row);
check('设置了 theme/change 监听', typeof handlers['on:theme/change'] === 'function');

// 覆盖层必须全是 { light, dark } 对 —— 传裸字符串官方会 throw。
const probe = [];
fakeCtx.get('theme').overrideTokens = (source, tokens) => {
  probe.push(tokens);
  return () => {};
};
mod.apply(fakeCtx);
const sample = probe[probe.length - 1];
const badPairs = Object.entries(sample || {}).filter(
  ([, v]) => !v || typeof v !== 'object' || !('light' in v) || !('dark' in v),
);
check('每个 token 都是 { light, dark } 对', badPairs.length === 0, badPairs.length ? JSON.stringify(badPairs.slice(0, 3)) : '');

// ── 渲染设置行 ──────────────────────────────────────────────────────────
console.log('\n渲染设置行 …');
try {
  const inject = handlers.rowSpec.inject();
  const tree = handlers.Row(inject);
  check('设置行渲染无异常', !!tree);
  const labels = [];
  (function walk(node) {
    if (node == null) return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (typeof node === 'string') return labels.push(node);
    if (node.kids) node.kids.forEach(walk);
    if (node.props && node.props.children) walk(node.props.children);
  })(tree);
  const text = labels.join(' | ');
  ids.forEach((id) => check(`设置行列出 ${id}`, text.includes(skins[id].label)));
} catch (e) {
  console.error('✗ 设置行渲染抛错：', e.message);
  failures.push('设置行渲染');
}

// ── 回归：theme/change 里不能重新叠 token 层 ──────────────────────────
// 官方 publish() 无条件发 theme/change，而 overrideTokens 内部就 publish()。
// 如果插件在 theme/change 回调里再 overrideTokens，就会事件套事件把页面转死
// （实测表现：界面卡住、截图拿不到新帧）。这里用一个「发事件就算重入」的
// 假 theme 服务把这类死循环钉住。
console.log('\ntheme/change 重入防护 …');
{
  let changeHandler = null;
  let overrideCalls = 0;
  let reentered = false;

  const ctx2 = {
    get: () => ({
      overrideTokens(source, tokens) {
        overrideCalls += 1;
        if (overrideCalls > 50) {
          reentered = true;
          throw new Error('overrideTokens 被无限重入调用');
        }
        // 模拟官方行为：overrideTokens 内部会 publish() → 发 theme/change
        if (changeHandler) changeHandler({});
        return () => {};
      },
    }),
    effect: (fn) => fn(),
    on: (event, fn) => {
      if (event === 'theme/change') changeHandler = fn;
      return () => {
        changeHandler = null;
      };
    },
    slots: { inject: () => {}, register: () => () => {} },
  };

  const mod2 = registered.factory((name) => {
    if (name === 'react') return fakeReact;
    throw new Error(`非预期 require：${name}`);
  });

  try {
    mod2.apply(ctx2);
    // 手动触发几次主题变化
    for (let i = 0; i < 5 && changeHandler; i++) changeHandler({});
  } catch (e) {
    reentered = true;
    console.error('  抛错：', e.message);
  }

  check('theme/change 不会无限重入 overrideTokens', !reentered, `overrideTokens 调用 ${overrideCalls} 次`);
  check('初次 apply 只叠一次 token 层', overrideCalls === 1, `实际 ${overrideCalls} 次`);
}

console.log('');
if (failures.length) {
  console.error(`✗ ${failures.length} 项失败：${failures.join(', ')}`);
  process.exit(1);
}
console.log('✓ 全部通过');
