/**
 * dsh-skin-kit —— 宿主半边
 *
 * 本插件的全部视觉效果都在客户端半边（client.js）：通过 DSH 官方的
 * 主题接口 `ctx.theme.overrideTokens()` 把皮肤叠成一层 token 覆盖。
 *
 * 宿主半边因此只需要：
 *   1. 被 Loader 加载到 —— `dsh.client` 声明是从「加载到的包清单」里读出来的，
 *      只有浏览器半边的话插件不会被发现；
 *   2. 落一个自诊断状态文件，便于确认插件真的被加载了。
 *
 * 不注册任何 HTTP 路由，不碰任何宿主服务。
 */

import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

/** Cordis 插件名。 */
export const name = 'skin-kit';

/** 插件版本，写进状态文件便于核对。 */
const VERSION = '1.0.0';

/** 自诊断状态文件。 */
const STATUS_FILENAME = '.skin-kit-status.json';

function dshHome() {
  const env = process.env.DSH_HOME;
  return env && env.trim() !== '' ? env : join(homedir(), '.dsh');
}

function writeJsonAtomic(target, value) {
  const tmp = `${target}.tmp`;
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(tmp, JSON.stringify(value, null, 2), 'utf8');
  // rename 在同一分区上是原子的；失败则退回直接写。
  try {
    renameSync(tmp, target);
  } catch {
    writeFileSync(target, JSON.stringify(value, null, 2), 'utf8');
  }
}

/**
 * Cordis 插件入口。宿主半边刻意保持最小。
 *
 * @param {object} ctx 插件上下文
 */
export function apply(ctx) {
  const status = {
    plugin: 'dsh-skin-kit',
    version: VERSION,
    loadedAt: new Date().toISOString(),
    node: process.version,
    role: 'host-half',
    note: '视觉层全部在 client.js；本半边仅用于被发现与自诊断。',
    routesRegistered: false,
  };

  try {
    writeJsonAtomic(join(dshHome(), STATUS_FILENAME), status);
  } catch {
    // 诊断写失败不影响主流程。
  }

  ctx?.logger?.info?.('skin-kit: 宿主半边已加载（视觉层在客户端半边）');
}
