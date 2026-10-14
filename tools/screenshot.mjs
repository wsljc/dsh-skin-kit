/**
 * 用 Edge/Chrome 的 CDP 接口给 DSH Web GUI 截图（带鉴权 cookie）。
 *
 * 为什么要这么绕：GUI 一律要求 dsh-auth-* cookie，否则 401；而普通
 * `msedge --screenshot` 没法设 cookie。所以走远程调试：
 *   1. 起一个 headless 浏览器 + --remote-debugging-port
 *   2. 用 CDP 的 Network.setCookie 种 cookie
 *   3. Page.navigate + 等待 → Page.captureScreenshot
 *
 * Node 22 自带 WebSocket，不需要任何依赖。
 *
 * 用法：
 *   node tools/screenshot.mjs <输出路径> [皮肤id] [--wait=毫秒] [--origin=http://127.0.0.1:19387]
 *   node tools/screenshot.mjs x.png --probe            # 只打印页面状态，不截图
 *   node tools/screenshot.mjs x.png --eval="..."       # 先在页面里求值（可 await）
 *
 * 依赖：Node 22+（自带 WebSocket）、本机 Edge 或 Chrome。不需要 npm 安装任何东西。
 */
import { createHmac, createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const PORT = 9333;

const args = process.argv.slice(2);
const ORIGIN = (args.find((a) => a.startsWith('--origin=')) || '--origin=http://127.0.0.1:19387').split('=')[1];
const outPath = args[0] ?? 'shot.png';
const skinId = args[1] && !args[1].startsWith('--') ? args[1] : null;
const waitMs = Number((args.find((a) => a.startsWith('--wait=')) || '--wait=4500').split('=')[1]);
/** --probe：只打印页面状态，不截图。 */
const probeOnly = args.includes('--probe');
/** --eval=<表达式>：在页面里求值后打印（用于切换主题偏好等）。 */
const evalExpr = (args.find((a) => a.startsWith('--eval=')) || '').slice('--eval='.length);
/** --lskeys：打印 localStorage 的全部键。 */
const lsKeys = args.includes('--lskeys');

const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => {
  try {
    readFileSync(p);
    return true;
  } catch {
    return false;
  }
});

if (!EDGE) {
  console.error('✗ 找不到 Edge / Chrome');
  process.exit(1);
}

// ── 造鉴权 cookie ───────────────────────────────────────────────────────
const b64u = (b) =>
  Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const yaml = readFileSync(join(homedir(), '.dsh', '.credentials.yaml'), 'utf8');
const secretRaw = /client-connection\/browser-session:[\s\S]*?secret:\s*(\S+)/.exec(yaml)[1];
const secret = Buffer.from(secretRaw.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const authority = new URL(ORIGIN).host;
const cookieName = 'dsh-auth-' + b64u(createHash('sha256').update(authority, 'utf8').digest());
const iat = Date.now();
const body = b64u(
  Buffer.from(JSON.stringify({ version: 1, authority, issuedAt: iat, expiresAt: iat + 3600_000 }), 'utf8'),
);
const cookieValue = `v1.${body}.${b64u(createHmac('sha256', secret).update(body, 'utf8').digest())}`;

// ── 起浏览器 ────────────────────────────────────────────────────────────
const profileDir = mkdtempSync(join(tmpdir(), 'dsh-shot-'));
const child = spawn(
  EDGE,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,900',
    'about:blank',
  ],
  { stdio: 'ignore', detached: false },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForDevtools() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return await res.json();
    } catch {
      /* 还没起来 */
    }
    await sleep(250);
  }
  throw new Error('DevTools 端口没起来');
}

/** 极简 CDP 客户端。 */
function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id !== undefined && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    } else if (msg.method) {
      events.push(msg);
    }
  });
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });
  return {
    events,
    ready,
    send(method, params = {}, sessionId) {
      return new Promise((resolve, reject) => {
        const msgId = ++id;
        pending.set(msgId, { resolve, reject });
        ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
      });
    },
    close() {
      ws.close();
    },
  };
}

const main = async () => {
  const version = await waitForDevtools();
  const client = cdp(version.webSocketDebuggerUrl);
  await client.ready;

  // 新建一个标签页
  const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await client.send('Target.attachToTarget', { targetId, flatten: true });

  const send = (method, params) => client.send(method, params, sessionId);
  await send('Page.enable');
  await send('Network.enable');
  await send('Runtime.enable');
  await send('Log.enable');

  // 收集页面里的报错，插件加载失败最常见的表现就是「什么都没发生」
  const pageIssues = [];
  const origPush = client.events.push.bind(client.events);
  client.events.push = (msg) => {
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      pageIssues.push('EXCEPTION: ' + (d.exception?.description || d.text));
    } else if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) {
      pageIssues.push(
        msg.params.type.toUpperCase() +
          ': ' +
          msg.params.args.map((a) => a.value ?? a.description ?? a.type).join(' '),
      );
    } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      pageIssues.push('LOG: ' + msg.params.entry.text);
    }
    return origPush(msg);
  };

  await send('Network.setCookie', {
    name: cookieName,
    value: cookieValue,
    domain: '127.0.0.1',
    path: '/',
    httpOnly: false,
    secure: false,
  });

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await send('Page.navigate', { url: ORIGIN + '/' });
  await sleep(waitMs);

  // 选皮肤（如果指定）
  if (skinId) {
    const script = `
      (() => {
        try {
          localStorage.setItem('dsh.skin.active', ${JSON.stringify(skinId)});
          localStorage.setItem('dsh.skin.decor', 'on');
          return 'set';
        } catch (e) { return 'err: ' + e.message; }
      })()
    `;
    const r = await send('Runtime.evaluate', { expression: script, returnByValue: true });
    console.log('  设置皮肤 →', JSON.stringify(r.result && r.result.value));
    await send('Page.reload');
    await sleep(waitMs);
  }

  // 任意表达式求值（调试用）。eval 里自己 await 到稳定状态即可，
  // 之后不再等待、直接截图，避免把 UI 又转回默认态。
  if (evalExpr) {
    const r = await send('Runtime.evaluate', {
      expression: evalExpr,
      returnByValue: true,
      awaitPromise: true,
    });
    console.log('  eval →', JSON.stringify(r.result && r.result.value));
  }

  if (lsKeys) {
    const r = await send('Runtime.evaluate', {
      expression: 'JSON.stringify(Object.fromEntries(Object.entries(localStorage)))',
      returnByValue: true,
    });
    console.log('  localStorage →', r.result.value);
  }

  // 报告一下页面里的实际状态，便于确认皮肤真的生效了
  const probe = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      skin: localStorage.getItem('dsh.skin.active'),
      decor: localStorage.getItem('dsh.skin.decor'),
      styleTags: document.querySelectorAll('style[data-skin-kit-css]').length,
      cssIds: [...document.querySelectorAll('style[data-skin-kit-css]')].map(s => s.getAttribute('data-skin-kit-css')),
      domLayers: [...document.querySelectorAll('[id^="dsh-skin-kit-dom-"]')].map(n => n.id),
      bgBase: getComputedStyle(document.documentElement).getPropertyValue('--dsw-alias-bg-base').trim(),
      brand: getComputedStyle(document.documentElement).getPropertyValue('--dsw-alias-brand-primary').trim(),
      bodyBgBase: getComputedStyle(document.body).getPropertyValue('--dsw-alias-bg-base').trim(),
      bodyBrand: getComputedStyle(document.body).getPropertyValue('--dsw-alias-brand-primary').trim(),
      rootStyleAttr: (document.documentElement.getAttribute('style') || '').slice(0, 160),
      bodyStyleAttr: (document.body.getAttribute('style') || '').slice(0, 160),
      darkFlag: document.body.hasAttribute('data-ds-dark-theme'),
      scrollerTop: (() => {
        const s = [...document.querySelectorAll('*')].filter(n => n.scrollHeight > n.clientHeight + 20)
          .sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
        return s ? { top: s.scrollTop, sh: s.scrollHeight, ch: s.clientHeight } : null;
      })(),
      skinRect: (() => {
        const t = [...document.querySelectorAll('div,span,b,label')].find(n => (n.textContent || '').trim() === '皮肤');
        if (!t) return null;
        const r = t.getBoundingClientRect();
        return { top: Math.round(r.top), left: Math.round(r.left), h: Math.round(r.height) };
      })(),
      probeEl: (() => {
        // 找真正承载 --dsw-alias-* 的元素
        const cands = [document.documentElement, document.body, document.getElementById('root')];
        return cands.filter(Boolean).map(n => n.tagName + '#' + (n.id || '') + '=' +
          getComputedStyle(n).getPropertyValue('--dsw-alias-bg-base').trim());
      })(),
      engine: !!(window.__DSH_SKIN_KIT__ && window.__DSH_SKIN_KIT__.skins),
      skins: window.__DSH_SKIN_KIT__ ? window.__DSH_SKIN_KIT__.skinIds : null,
    })`,
    returnByValue: true,
  });
  console.log('  页面状态 →', probe.result.value);

  if (pageIssues.length) {
    console.log('  页面报错：');
    [...new Set(pageIssues)].slice(0, 12).forEach((m) => console.log('    ' + m.slice(0, 400)));
  } else {
    console.log('  页面报错：无');
  }

  if (probeOnly) {
    client.close();
    return;
  }

  // headless 的合成器在 JS 改完 DOM 后不一定出新帧，截出来会是旧画面。
  // startScreencast 会促使合成器出帧；但别等它（等不到会卡住整个脚本），
  // 给一个很短的窗口，拿到帧或超时都继续。
  try {
    await Promise.race([
      (async () => {
        let resolveFrame;
        const frame = new Promise((r) => {
          resolveFrame = r;
        });
        const orig = client.events.push.bind(client.events);
        client.events.push = (msg) => {
          if (msg.method === 'Page.screencastFrame') {
            send('Page.screencastFrameAck', { sessionId: msg.params.sessionId }).catch(() => {});
            resolveFrame();
          }
          return orig(msg);
        };
        await send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
        await frame;
        await send('Page.stopScreencast').catch(() => {});
      })(),
      sleep(700),
    ]);
  } catch {
    /* 拿不到新帧也照样截，最多是旧画面 */
  }
  await sleep(120);

  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  console.log(`  → ${outPath}  ${(Buffer.from(shot.data, 'base64').length / 1024).toFixed(0)} KB`);

  client.close();
};

main()
  .catch((e) => {
    console.error('✗ 截图失败：', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sleep(200);
    child.kill();
  });
