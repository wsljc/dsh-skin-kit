/**
 * 把 src/ 与 skins/ 下的脚本块拼成自包含的 client.js。
 *
 * DSH 的客户端插件 bundle 格式是固定的：
 *
 *     window.__ModuleLoader__.load({ id, factory })
 *
 * factory 收到一个 require，只能解析宿主预置的包（react、cordis 等），
 * **不能解析相对路径**。所以皮肤与引擎必须在构建期拼进同一个文件。
 *
 * 用法：
 *     node tools/embed-assets.mjs   # 图片 → src/assets.generated.js
 *     node tools/build.mjs          # 全部 → client.js
 *     node tools/build.mjs --check  # 只校验产物是否与源码同步（CI 用）
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const checkOnly = process.argv.includes('--check');

const PKG = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const PLUGIN_ID = PKG.name;

/**
 * 拼接顺序有语义：
 *   1. assets —— 最先，皮肤构建 CSS 时要读图
 *   2. engine —— 提供 window.__DSH_SKIN_KIT__
 *   3. sheets —— token 调色板，注册到 window.__DSH_SKIN_SHEETS__
 *   4. decor  —— 装饰 CSS / DOM 构造器
 *   5. skins  —— 皮肤定义，注册到 window.__DSH_SKINS__
 *   6. entry  —— 读注册表建插件，export apply
 */
const BLOCKS = [
  ['资源（data URI 内嵌图片）', 'src/assets.generated.js'],
  ['引擎', 'src/engine.js'],
  ['调色板 · P5R', 'skins/p5r/tokens.js'],
  ['调色板 · 纸白纸墨', 'skins/paper-ink/tokens.js'],
  ['调色板 · 终端绿', 'skins/terminal-green/tokens.js'],
  ['装饰 · P5R CSS', 'skins/p5r/decor.js'],
  ['装饰 · P5R DOM', 'skins/p5r/dom.js'],
  ['皮肤 · P5R 漫画', 'skins/p5r/skin.js'],
  ['皮肤 · 纸白纸墨', 'skins/paper-ink/skin.js'],
  ['皮肤 · 终端绿', 'skins/terminal-green/skin.js'],
  ['入口', 'src/entry.js'],
];

function readBlock(rel) {
  const abs = join(root, rel);
  if (!existsSync(abs)) {
    throw new Error(
      `缺少 ${rel}。\n` +
        (rel.includes('generated')
          ? '先跑：node tools/embed-assets.mjs'
          : '请检查仓库完整性。'),
    );
  }
  return readFileSync(abs, 'utf8').trimEnd();
}

const parts = [];
const table = [];
for (const [title, rel] of BLOCKS) {
  const src = readBlock(rel);
  parts.push(`      /* ══ ${title} ══ ${rel} */\n${src}`);
  table.push(`  ${rel.padEnd(34)} ${(src.length / 1024).toFixed(1)} KB`);
}

const header = `/**
 * ${PKG.name} v${PKG.version} —— DSH 客户端皮肤插件（构建产物）
 * ${PKG.description}
 *
 * ⚠️ 本文件由 tools/build.mjs 生成，**不要直接编辑** —— 改动会在下次构建时丢失。
 * 源码在 src/ 与 skins/ 下；改完跑：
 *
 *     node tools/embed-assets.mjs && node tools/build.mjs
 *
 * 机制：走 DSH 官方主题接口 theme.overrideTokens(source, tokens)，
 * 叠一层 token 覆盖在「当前激活的主题」之上——不注册主题、不改 preference。
 * 这样它与内置明/暗、以及 catppuccin 等第三方主题都能共存。
 */

window.__ModuleLoader__.load({
  id: ${JSON.stringify(PLUGIN_ID)},
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    const react = require('react');

${parts.join('\n\n')}

    return module.exports;
  },
});
`;

const outPath = join(root, 'client.js');
const prev = existsSync(outPath) ? readFileSync(outPath, 'utf8') : null;

if (checkOnly) {
  if (prev === header) {
    console.log('✓ client.js 与源码同步');
    process.exit(0);
  }
  console.error('✗ client.js 与源码不同步。请跑：node tools/embed-assets.mjs && node tools/build.mjs');
  process.exit(1);
}

writeFileSync(outPath, header, 'utf8');

console.log('拼接顺序：');
console.log(table.join('\n'));
console.log(`\n→ client.js  ${(header.length / 1024).toFixed(0)} KB`);
if (prev === null) console.log('  （新建）');
else if (prev !== header) console.log(`  （更新，原 ${(prev.length / 1024).toFixed(0)} KB）`);
else console.log('  （内容无变化）');
