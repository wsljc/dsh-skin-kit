# 它是怎么工作的

给想改引擎、或想确认「这东西到底动了什么」的人。

## 插件形态

DSH 的插件分两半，**两半都必须有**：

```
index.js         宿主半边（Node）：不注册路由、不碰宿主服务，
                 只写一个自诊断状态文件，证明自己被 Loader 加载了
client.js        客户端半边（浏览器）：全部视觉逻辑
cordis.patch.yml 把自己 insert 进 profile 的层栈
package.json     声明 dsh.client（platform / inject）与 exports["./client"]
```

**宿主半边不能省**：`dsh.client` 声明是从「Loader 加载到的包清单」里读出来的，
只有浏览器半边的话插件根本不会被发现。但宿主半边可以几乎为空。

## 客户端 bundle 的格式约束

DSH 的客户端插件是这么被加载的：

```html
<script src="plugins/??dsh-skin-kit/client.js&rev=..."></script>
```

文件内容是：

```js
window.__ModuleLoader__.load({
  id: 'dsh-skin-kit',
  factory: (require) => { /* ... */ return module.exports; },
});
```

两个硬约束：

1. **必须是单个自包含文件。** factory 收到的 `require` 只解析宿主预置的包
   （`react`、`@deepseek-ai/cordis` 等），**不解析相对路径**。所以引擎、皮肤、
   图片全都要在构建期拼进同一个 `client.js`。
2. **不能用 ESM 语法。** `src/` 与 `skins/` 下的都是「脚本块」（IIFE），
   因为它们是**文本拼接**进 factory 函数体里的，`import` / `export` 会直接语法错误。

`tools/build.mjs` 就是干这件事：按固定顺序读文本、拼进模板、写出 `client.js`。
它会在产物顶部写明「构建产物，不要直接编辑」。

## 加载顺序

拼接顺序**有语义**，因为块之间通过全局命名空间通信：

```
1. src/assets.generated.js   → __DSH_SKIN_ASSETS__   图片 data URI（皮肤构建 CSS 时要读）
2. src/engine.js             → __DSH_SKIN_KIT__      引擎，并负责开好下面四个容器
3. skins/*/tokens.js         → __DSH_SKIN_SHEETS__   token 调色板
4. skins/*/decor.js, dom.js  → __DSH_SKIN_DECOR__    装饰 CSS / DOM 构造器
5. skins/*/skin.js           → __DSH_SKINS__         皮肤定义（组装上面几样）
6. src/entry.js              → exports.apply         读注册表建插件
```

引擎最先跑，由它 `Object.defineProperty` 开好四个命名空间，后面的块往里注册。

## 状态与投影

引擎内部有一份状态：`active`（当前皮肤 id）、`decorOn`（装饰开关）、
`variants`（每个皮肤的档位）。改动一律走 `sync()`：

```
sync()
 ├─ 撤掉上一层的 overrideTokens disposer
 ├─ 如果换了皮肤：撤掉上一个皮肤的装饰 CSS 与装饰 DOM
 ├─ 叠新的 token 层   theme.overrideTokens('skin:<id>', pairs)
 └─ 投新的装饰层      <style data-skin-kit-css="<id>"> + 装饰 DOM
```

`sync()` 幂等，可以反复调。装饰 CSS 与 DOM 都做了「内容没变就不重写」的短路——
重写 `<style>` 会让 CSS 动画从头开始，背景漂移会肉眼可见地跳帧。

## 两个必须知道的坑

### 坑 1：不能注册主题，只能叠层

`theme.register()` + `theme.setTheme()` 要抢 `preference`。实测已装的
`dsh-catppuccin` 会在 `theme/change` 里把 preference 抢回它自己的 flavor，
导致刚设的皮肤立刻被顶掉。

`theme.overrideTokens(source, tokens)` 是「叠在激活主题之上」的层，按 seq 叠加、
后叠者胜，不参与 preference 争夺。官方源码里的语义（`lib/client.js`）：

```js
overrideTokens(source, tokens) {
  const layer = { seq: this.overrideSeq++, tokens: validateOverrides(source, tokens) };
  this.overrides.set(source, layer);   // 同一个 source 再调 = 整体替换并重新叠到最上
  this.publish();
  return () => { /* 移除这一层 */ };
}
```

同一 source 再调一次会**替换**整层并重新置顶，所以换档位时直接再调一次即可，
但要注意旧 disposer 对已被替换的层是 no-op。

### 坑 2：theme/change 里不能叠层（会死循环）

官方 `publish()` 是**无条件**发 `theme/change` 的：

```js
publish() {
  this.revision += 1;
  this.snapshot = this.buildSnapshot();
  this.ctx.emit("theme/change", this.snapshot);
}
```

而 `overrideTokens()` 内部就会 `publish()`。所以：

```js
ctx.on('theme/change', () => {
  theme.overrideTokens(...);   // ❌ 事件套事件，页面直接卡死
});
```

实测表现是界面卡住、连截图都拿不到新帧。本引擎的做法是：
`theme/change` 只重投**装饰层**（`resync()`），token 层只在用户改选择时才动。
`tools/smoke-test.mjs` 里有一条专门的重入回归测试钉住这个坑。

### 坑 3：useSyncExternalStore 的 getSnapshot 必须返回稳定引用

设置行用 `react.useSyncExternalStore(subscribe, snapshot)` 订阅状态。
React 会拿 `snapshot()` 的返回值做 `Object.is` 比较，**每次 new 一个对象**会被
判定为「一直在变」，直接抛 React error #185（无限重渲染），表现是设置行整块不渲染
且控制台报 `slot entry crashed in 'settings.general.item'`。

引擎里的 `buildSnapshot()` 因此缓存一份，只在状态真的变了才换新对象；
`setVariant` 也整体替换 `variants` 对象而不是原地改字段。

## 设置行挂在哪

```js
ctx.slots.inject(slot, () =>
  ctx.slots.register({ name: slot, id: ENGINE_ID, key: ENGINE_ID, order: 22, inject }, Row),
);
```

- `inject` 是**返回 props 的函数**（不是 props 对象，也**没有 `useStore` 这个 prop**）
- 组件里用 `react.useSyncExternalStore(props.subscribe, props.snapshot)` 订阅
- 引擎同时尝试 `plugins.bundle.config` 与 `settings.general.item` 两个 slot，
  哪个存在用哪个（当前 0.2.0-rc.2 上生效的是 `settings.general.item`）

## 宿主半边写了什么

只做一件事：把 `$DSH_HOME/.skin-kit-status.json` 原子写出去（先写 `.tmp` 再
`rename`，同分区上原子）。

```json
{ "plugin": "dsh-skin-kit", "version": "1.0.0", "role": "host-half", "routesRegistered": false }
```

这个文件是**判定「插件真的被加载了」**的依据。注意要跟进程启动时间对比：
配置改动热生效（加插件行不用重启），但**代码改动不生效**——ESM 模块缓存旧 bundle，
必须重启 DSH。

## 验证链路

按可靠性从低到高：

| 手段 | 能证明什么 |
|---|---|
| `node --check client.js` | 语法没坏 |
| `node tools/build.mjs --check` | 产物与源码同步 |
| `node tools/smoke-test.mjs` | 注册表、apply、token 形状、设置行、重入防护都对 |
| `$DSH_HOME/.skin-kit-status.json` | 宿主半边被 Loader 加载了 |
| `node tools/verify-live.mjs` | 真实页面清单里声明了本插件，且 client.js 能取到 |
| 截图 + DOM 探针 | 皮肤真的生效（token 值、装饰标签、装饰 DOM 都在） |

`verify-live.mjs` 需要鉴权 cookie。启动 token 拿不到（在进程内 WeakMap 里，
只经 Node IPC 传给 Electron 主进程），但签名密钥是可读的：`$DSH_HOME/.credentials.yaml`
里 `client-connection/browser-session` 的 `secret`（明文 YAML）。

```
cookie 名 = dsh-auth- + base64url(sha256(Host authority))
cookie 值 = v1.<b64url(json)>.<b64url(hmac-sha256(json))>
```
