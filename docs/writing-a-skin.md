# 写一个皮肤

引擎与皮肤是分开的：**引擎**（`src/engine.js`）负责叠 token 层、注入装饰、持久化、
渲染设置行；**皮肤**只是一份纯数据声明。加皮肤不需要碰引擎。

## 目录约定

```
skins/<你的皮肤名>/
├── skin.js        # 必须：皮肤定义（注册到 window.__DSH_SKINS__）
├── tokens.js      # 可选：token 表太大时拆出来
├── decor.js       # 可选：装饰 CSS 构造器
├── dom.js         # 可选：装饰 DOM 构造器
└── assets/        # 可选：图片（构建期内嵌成 data URI）
```

## 最小皮肤

```js
;(function (window) {
  'use strict';
  window.__DSH_SKINS__['my-skin'] = {
    id: 'my-skin',
    label: '我的皮肤',
    hint: '一句话说明',
    swatch: ['#101014', '#7c5cff'],
    tokens: {
      '--dsw-alias-bg-base': '#101014',
      '--dsw-alias-brand-primary': { light: '#5b3fd6', dark: '#7c5cff' },
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
```

## 字段全表

| 字段 | 必填 | 说明 |
|---|---|---|
| `id` | ✓ | 唯一 id。同时用作 localStorage 键与 CSS 层标记 |
| `label` | ✓ | 设置行里的标题 |
| `hint` | | 标题下的灰色小字 |
| `swatch` | | 色块数组（十六进制字符串），建议 2–4 个 |
| `tokens` | ✓ | token 表，见下 |
| `variants` | | 同一皮的多档位，见下 |
| `defaultVariant` | | 默认档位 id |
| `css` | | 装饰 CSS：`{ 档位名: css字符串 \| () => css }` |
| `dom` | | 装饰 DOM：`{ 档位名: () => HTMLElement }` |
| `default` | | `true` 则默认启用（注册表里只应有一个） |

## tokens 的两种写法

```js
tokens: {
  // 裸字符串 = 明暗两臂同色（皮肤固定深色时最常用）
  '--dsw-alias-bg-base': '#0b0b0e',

  // { light, dark } 对 = 跟随应用当前的明暗设置
  '--dsw-alias-brand-primary': { light: '#1b365d', dark: '#7c5cff' },
}
```

> ⚠️ 官方接口**只接受 `{ light, dark }` 对**，传裸字符串会抛一个教学式错误。
> 引擎替你做了包装，所以皮肤里可以放心写裸字符串。

只覆写「有意义」的 token。官方文档明确说第三方覆写集没有完整性校验，
列太多反而容易把界面弄花。

## 档位（variants）

同一套配色做出「全彩 / 朴素」这类变体：

```js
variants: {
  comic: { label: '全彩' },
  plain: {
    label: '朴素（灰阶去影）',
    tokens: {                       // 补丁：叠在基础 tokens 上，只列要改的
      '--dsw-alias-brand-primary': '#9aa0a8',
      '--dsw-elevation-panel': 'none',
    },
  },
},
defaultVariant: 'comic',
```

设置行会在选中该皮肤时自动出现档位按钮（`variants` 多于 1 个才显示）。

## 装饰层

装饰层由「装饰层」复选框统一控制，关掉后只剩配色。每个皮肤按自己的 id 挂
一个 `<style>` 与一个 DOM 挂载点，切皮肤时旧的会被撤掉。

```js
css: {
  comic: function () { return '/* 你的 CSS */'; },   // 函数或字符串都行
  // plain 档位没写 = 该档位不加装饰
},
dom: {
  comic: function (skin, variant) {
    var el = document.createElement('div');
    el.className = 'my-decor';
    el.innerHTML = '<div class="my-decor-inner"></div>';
    return el;                                       // 返回节点即可
  },
},
```

`dom` 构造器返回的节点会被自动设置 `id`、`data-plugin`、`aria-hidden="true"`。

**CSS 里能用的钩子**（按稳定性排序）：

1. **token 变量**（最稳）——`var(--dsw-alias-*)`，永不失效
2. **元素选择器**——`button`、`input`、`[role="button"]`
3. **稳定 data 属性**——`[data-conversation-tabs]`、`[data-shortcut-modal="settings"]`、
   `[data-composer-card]`、`[data-phase]`、`[data-sidebar-right-panel]`
4. **模块名子串**（尽力而为）——`[class*="markdown"]`、`[class*="bubble"]`、
   `[class*="_tabs_"]`。官方编译产物会保留这些语义片段，但官方**没有承诺**它们不变

**不要写完整哈希类名**（`BynINW_frame` 这种），升级必失效。

### 子串选择器的陷阱：一个名字可能不是你要的组件

`[class*="_tabs_"]` 看着像「顶部那个『对话 / 轨迹』切换器」，实际打的是官方
**另一个**通用分段控件。真正的视图切换器来自 conversation 包，得用稳定属性命中：

```css
/* ✅ 精确命中顶部视图切换器 */
body [data-conversation-tabs] > button[aria-selected='true'] {
  background-color: var(--dsw-alias-brand-primary) !important;
  color: #fffdf4 !important;
}
/* 官方选中下划线是 ::after 画的，想改用色块表达就先清掉它 */
body [data-conversation-tabs] > button::after { content: none !important; }
```

踩过的坑：只靠 `_tabs_` 一条规则时，这两个键被全局 `button` 规则套成
「斜切黑框 + 各自描边」，红下划线还被压在框下面。**写装饰前先在 DevTools 里
选中真实元素、确认它到底带哪些属性**，别凭类名猜。

顺带一提：用 `body` 前缀是为了把特异性抬到全局 `button` 规则之上——
官方那些规则常常也带 `!important`，特异性不够时你的规则会被压过去。

### 给组件加样式前，先看它有没有你要的 DOM

顶部视图切换器**没有滑动指示条元素**（那是 `_tabs_` 那个控件才有的），
所以选中态只能用「长在键上的红块」表达，做不出滑动动画。这不是偷懒，
是组件结构决定的。先看 DOM 再决定能做到什么程度。

### 尊重 prefers-reduced-motion

动画包一层媒体查询，这是无障碍底线：

```css
@media (prefers-reduced-motion: reduce) {
  .my-decor { animation: none; }
}
```

## 内嵌图片

客户端 bundle 是**单个 client.js**，运行期没有相对路径可用的 `assets/` 目录，
所以图片必须在构建期内联成 data URI。

1. 把图放进 `skins/<你的皮肤名>/assets/`
2. 在 `tools/embed-assets.mjs` 的 `ASSETS` 里加一行：

```js
const ASSETS = {
  p5rStation: 'skins/p5r/assets/station.jpg',
  myBackdrop: 'skins/my-skin/assets/backdrop.jpg',   // ← 加这行
};
```

3. 跑 `node tools/embed-assets.mjs`，然后在皮肤里取：

```js
var assets = window.__DSH_SKIN_ASSETS__ || {};
var url = assets.myBackdrop;   // 'data:image/jpeg;base64,...'
```

图片是 base64 内嵌的，体积会膨胀约 33%——大图请先压缩。

## 注册到构建

在 `tools/build.mjs` 的 `BLOCKS` 数组里按顺序加一行（**顺序有语义**：
assets → engine → 调色板 → 装饰 → 皮肤 → entry）：

```js
const BLOCKS = [
  ['资源（data URI 内嵌图片）', 'src/assets.generated.js'],
  ['引擎', 'src/engine.js'],
  ['调色板 · 我的皮肤', 'skins/my-skin/tokens.js'],   // ← 加
  ['皮肤 · 我的皮肤', 'skins/my-skin/skin.js'],       // ← 加
  ['入口', 'src/entry.js'],
];
```

然后：

```powershell
node tools/embed-assets.mjs
node tools/build.mjs
node tools/smoke-test.mjs
```

## 调色板拆文件时的命名空间

皮肤块之间通过几个全局命名空间通信（引擎最先加载、负责开好容器）：

| 命名空间 | 用途 |
|---|---|
| `window.__DSH_SKIN_ASSETS__` | 内嵌图片的 data URI |
| `window.__DSH_SKIN_SHEETS__` | token 调色板 |
| `window.__DSH_SKIN_DECOR__` | 装饰 CSS / DOM 构造器 |
| `window.__DSH_SKINS__` | 皮肤定义（引擎最终读这个） |

大调色板建议拆到 `tokens.js` 里，挂到 `__DSH_SKIN_SHEETS__`，再由 `skin.js` 组装。
见 `skins/p5r/` 的做法。

## 调试

浏览器 DevTools 里：

```js
window.__DSH_SKIN_KIT__.skins        // 已注册的皮肤
window.__DSH_SKIN_KIT__.skinIds      // 皮肤 id 列表
localStorage.getItem('dsh.skin.active')   // 当前皮肤
localStorage.removeItem('dsh.skin.active') // 清掉选择，回到默认
document.querySelectorAll('style[data-skin-kit-css]')   // 已注入的装饰 CSS
```

改完 `client.js` **刷新页面**才生效（`dsh-hmr` 只盯 `package.json` 与
`cordis.patch.yml`，不盯客户端代码）。
