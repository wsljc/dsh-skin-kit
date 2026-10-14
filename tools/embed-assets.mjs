/**
 * 把皮肤用到的图片转成 data URI 脚本块。
 *
 * 为什么必须内嵌：DSH 的客户端插件 bundle 是**单个 client.js 文件**，
 * 由 <script src="plugins/??<包名>/client.js"> 加载，运行期没有「同目录下的
 * assets/」这种相对路径可用。所以图片一律在构建期内联成 data URI。
 *
 * 用法：node tools/embed-assets.mjs
 * 产物：src/assets.generated.js（可提交，也可随时重新生成）
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

/** 图片 → data URI。扩展名决定 MIME。 */
const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

/**
 * 要内嵌的资源清单：产物里的变量名 → 相对仓库根的文件路径。
 * 新增图片就在这里加一行；皮肤里用 window.__DSH_SKIN_ASSETS__.<变量名> 取。
 */
const ASSETS = {
  p5rStation: 'skins/p5r/assets/station.jpg',
  p5rSettings: 'skins/p5r/assets/settings.jpg',
};

function toDataUri(relPath) {
  const abs = join(root, relPath);
  if (!existsSync(abs)) return null;
  const ext = relPath.slice(relPath.lastIndexOf('.')).toLowerCase();
  const mime = MIME[ext];
  if (!mime) throw new Error(`未知图片类型：${relPath}`);
  const buf = readFileSync(abs);
  return `data:${mime};base64,${buf.toString('base64')}`;
}

const lines = [];
const report = [];

for (const [name, relPath] of Object.entries(ASSETS)) {
  const uri = toDataUri(relPath);
  if (uri === null) {
    lines.push(`    // ${name}: 缺少 ${relPath}（跳过）`);
    report.push(`  ✗ ${name.padEnd(12)} ${relPath} —— 文件不存在，已跳过`);
    continue;
  }
  lines.push(`    ${name}: ${JSON.stringify(uri)},`);
  report.push(`  ✓ ${name.padEnd(12)} ${relPath} → ${(uri.length / 1024).toFixed(0)} KB`);
}

const out = `/**
 * 由 tools/embed-assets.mjs 生成 —— 不要手改。
 * 重新生成：node tools/embed-assets.mjs
 *
 * 图片以 data URI 内嵌：客户端 bundle 是单个 client.js，
 * 运行期没有相对路径可用的 assets/ 目录。
 */
;(function (window) {
  'use strict';
  window.__DSH_SKIN_ASSETS__ = Object.assign(window.__DSH_SKIN_ASSETS__ || {}, {
${lines.join('\n')}
  });
})(typeof window !== 'undefined' ? window : globalThis);
`;

mkdirSync(join(root, 'src'), { recursive: true });
writeFileSync(join(root, 'src/assets.generated.js'), out, 'utf8');

console.log('内嵌资源：');
console.log(report.join('\n'));
console.log(`\n→ src/assets.generated.js（${(out.length / 1024).toFixed(0)} KB）`);
void relative;
