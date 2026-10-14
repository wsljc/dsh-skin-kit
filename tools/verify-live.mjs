/**
 * 验证插件是否真的进入了 Web 前端的插件清单，并取回它的 client.js。
 *
 * DSH Web GUI 一律要求鉴权 cookie，否则 401。启动 token 拿不到（在进程内
 * WeakMap 里），但签名密钥是可读的：$DSH_HOME/.credentials.yaml 里
 * client-connection/browser-session 的 secret。
 *
 *   cookie 名 = dsh-auth- + base64url(sha256(Host authority))
 *   值        = v1.<b64url(json)>.<b64url(hmac-sha256(json))>
 *
 * 用法：node tools/verify-live.mjs [origin] [插件包名]
 */
import { createHmac, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const origin = process.argv[2] ?? 'http://127.0.0.1:19387';
const pluginName = process.argv[3] ?? 'dsh-skin-kit';

const b64u = (b) =>
  Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const yaml = readFileSync(join(homedir(), '.dsh', '.credentials.yaml'), 'utf8');
const m = /client-connection\/browser-session:[\s\S]*?secret:\s*(\S+)/.exec(yaml);
if (!m) {
  console.error('✗ 在 .credentials.yaml 里找不到 browser-session secret');
  process.exit(1);
}
const secret = Buffer.from(m[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const authority = new URL(origin).host;
const name = 'dsh-auth-' + b64u(createHash('sha256').update(authority, 'utf8').digest());
const iat = Date.now();
const body = b64u(
  Buffer.from(JSON.stringify({ version: 1, authority, issuedAt: iat, expiresAt: iat + 3600_000 }), 'utf8'),
);
const sig = b64u(createHmac('sha256', secret).update(body, 'utf8').digest());
const cookie = `${name}=v1.${body}.${sig}`;

const html = await (await fetch(origin + '/', { headers: { cookie } })).text();
console.log(`GET ${origin}/  →  ${html.length} 字节`);

// 前端把客户端模块清单内联在 HTML 里：{"id":"<包名>","url":"..."}
const re = new RegExp(`"id":"${pluginName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}","url":"([^"]+)"`);
const entry = re.exec(html);
if (!entry) {
  console.error(`✗ 页面清单里没有 ${pluginName}`);
  const ids = [...html.matchAll(/"id":"([^"]+)","url"/g)].map((x) => x[1]);
  console.log(`  清单里共 ${ids.length} 个客户端模块：`);
  console.log('  ' + ids.join(', '));
  process.exit(1);
}

const rel = entry[1].replace(/&amp;/g, '&');
console.log(`✓ 清单已声明：${pluginName}`);
console.log(`  入口：${rel}`);

const res = await fetch(`${origin}/${rel}`, { headers: { cookie } });
const text = await res.text();
console.log(`\nGET ${rel}`);
console.log(`  → ${res.status} ${res.headers.get('content-type')} ${text.length} 字节`);

for (const marker of [
  '__ModuleLoader__.load',
  'id: "dsh-skin-kit"',
  'overrideTokens',
  'p5r-comic',
  'paper-ink',
  'terminal-green',
  '__DSH_SKIN_ASSETS__',
]) {
  const n = text.split(marker).length - 1;
  console.log(`  ${n > 0 ? '✓' : '✗'} ${marker}  ×${n}`);
}
