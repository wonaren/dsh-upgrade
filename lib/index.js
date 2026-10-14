/**
 * dsh-upgrade plugin - Host (Server) half
 * Provides version checking, npm upgrade execution, profile backup, and launchd restart.
 */
import { spawn, execFile, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export const name = 'dsh-upgrade';
export const inject = ['webServer'];

// Semver parser & comparator (supports prerelease -rc.x, -alpha.x)
function parseSemver(v) {
  if (!v) return null;
  const clean = String(v).trim().replace(/^v/, '');
  const m = clean.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/);
  if (!m) return null;

  let prerelease = null;
  if (m[4]) {
    prerelease = [];
    const parts = m[4].split('.');
    for (const p of parts) {
      const sub = p.match(/([a-zA-Z]+|\d+)/g);
      if (sub && sub.length > 1) {
        prerelease.push(...sub);
      } else {
        prerelease.push(p);
      }
    }
  }

  return {
    major: parseInt(m[1], 10),
    minor: parseInt(m[2], 10),
    patch: parseInt(m[3], 10),
    prerelease,
    raw: clean
  };
}

function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return String(a || '').localeCompare(String(b || ''));
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  if (pa.patch !== pb.patch) return pa.patch - pb.patch;
  if (!pa.prerelease && !pb.prerelease) return 0;
  if (!pa.prerelease) return 1; // 1.0.0 > 1.0.0-rc
  if (!pb.prerelease) return -1;
  const len = Math.max(pa.prerelease.length, pb.prerelease.length);
  for (let i = 0; i < len; i++) {
    const p1 = pa.prerelease[i];
    const p2 = pb.prerelease[i];
    if (p1 === undefined) return -1;
    if (p2 === undefined) return 1;
    const n1 = Number(p1);
    const n2 = Number(p2);
    const isN1 = !isNaN(n1) && String(n1) === p1;
    const isN2 = !isNaN(n2) && String(n2) === p2;
    if (isN1 && isN2) {
      if (n1 !== n2) return n1 - n2;
    } else if (isN1 && !isN2) {
      return -1;
    } else if (!isN1 && isN2) {
      return 1;
    } else {
      if (p1 !== p2) return p1.localeCompare(p2);
    }
  }
  return 0;
}

// Read current installed dsh version
function getCurrentVersion() {
  // 1. Try resolving dsh binary realpath
  try {
    const whichOut = execSync('which dsh', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (whichOut) {
      const realBin = fs.realpathSync(whichOut);
      const pkgPath = path.resolve(realBin, '../../package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.name === '@deepseek-ai/dsh' && pkg.version) return pkg.version;
      }
    }
  } catch (e) {}

  // 2. Try global npm prefix
  try {
    const prefixOut = execSync('npm prefix -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (prefixOut) {
      const pkgPath = path.join(prefixOut, 'lib/node_modules/@deepseek-ai/dsh/package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.version) return pkg.version;
      }
    }
  } catch (e) {}

  // 3. Known standard directories
  const possiblePaths = [
    '/opt/homebrew/lib/node_modules/@deepseek-ai/dsh/package.json',
    path.join(os.homedir(), '.local/lib/node_modules/@deepseek-ai/dsh/package.json'),
    '/usr/local/lib/node_modules/@deepseek-ai/dsh/package.json'
  ];
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (pkg.version) return pkg.version;
      }
    } catch (e) {}
  }

  // 4. Try running dsh --version
  try {
    const verOut = execSync('dsh --version', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (verOut && /^\d+\.\d+\.\d+/.test(verOut)) {
      return verOut.replace(/^v/, '');
    }
  } catch (e) {}

  return '0.2.0-rc.2';
}

// Locate npm executable
function getNpmBin() {
  if (fs.existsSync('/opt/homebrew/bin/npm')) return '/opt/homebrew/bin/npm';
  if (fs.existsSync('/usr/local/bin/npm')) return '/usr/local/bin/npm';
  return 'npm';
}

// Upgrade task state
const taskState = {
  running: false,
  step: 'idle', // 'idle' | 'backing_up' | 'installing' | 'restarting' | 'error' | 'success'
  targetVersion: null,
  currentVersion: null,
  backupPath: null,
  logs: [],
  error: null,
  startedAt: 0,
  finishedAt: 0
};

function addLog(msg) {
  const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
  taskState.logs.push(line);
  if (taskState.logs.length > 300) taskState.logs.shift();
}

// Remote registry cache
let remoteCache = null;
let remoteCacheTime = 0;

async function fetchRemoteRegistry(force = false) {
  const now = Date.now();
  if (!force && remoteCache && now - remoteCacheTime < 15000) {
    return remoteCache;
  }

  const registries = [
    'https://registry.npmmirror.com/@deepseek-ai/dsh',
    'https://registry.npmjs.org/@deepseek-ai/dsh'
  ];

  let lastError = null;
  for (const regUrl of registries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(regUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        remoteCache = data;
        remoteCacheTime = now;
        return data;
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (remoteCache) return remoteCache;
  throw lastError || new Error('Failed to query npm registry');
}

// Record upgrade notes to file
function recordUpgradeNotes(oldVer, newVer, backupPath) {
  const notesPath = '/Users/wonaren/XCCCC/vs/deepseek-harness/.dsh-upgrade-notes.txt';
  try {
    let existing = '';
    if (fs.existsSync(notesPath)) {
      existing = fs.readFileSync(notesPath, 'utf8');
    }
    const dateStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newEntry = [
      `rollback point: @deepseek-ai/dsh@${oldVer}`,
      `before: ${oldVer}`,
      `after:  ${newVer}   (upgraded ${dateStr}, web auto-restarted via plugin)`,
      `install prefix: /opt/homebrew (global npm)`,
      `rollback cmd: /opt/homebrew/bin/npm install -g @deepseek-ai/dsh@${oldVer}`,
      `profile backup: ${backupPath || 'none'}`,
      '',
      '--- previous records ---',
      existing
    ].join('\n');
    fs.writeFileSync(notesPath, newEntry, 'utf8');
  } catch (err) {
    console.error('[dsh-upgrade] failed to update .dsh-upgrade-notes.txt', err);
  }
}

function triggerRestartService(delay = 500, logCallback = null) {
  setTimeout(() => {
    try {
      const uid = process.getuid ? process.getuid() : 501;
      const rChild = spawn('launchctl', ['kickstart', '-k', `gui/${uid}/com.deepseek.dsh.web`], {
        detached: true,
        stdio: 'ignore'
      });
      rChild.unref();
      if (logCallback) logCallback('已发送重启指令，等待后台拉起...');
    } catch (e) {
      if (logCallback) logCallback(`重启指令异常: ${e.message}，尝试直接退出旧进程以触发 KeepAlive 重启`);
      setTimeout(() => process.exit(0), 500);
    }
  }, delay);
}

// Pre-flight check plugin compatibility against targetVersion
function checkPluginsCompatibility(targetVersion) {
  if (!targetVersion) return { targetVersion: '', incompatible: [], totalChecked: 0 };
  const cleanTarget = String(targetVersion).trim().replace(/^v/, '');
  const profileDir = path.join(os.homedir(), '.dsh/profiles/web');
  const pkgJsonPath = path.join(profileDir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) return { targetVersion: cleanTarget, incompatible: [], totalChecked: 0 };

  let profilePkg;
  try {
    profilePkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  } catch (e) {
    return { targetVersion: cleanTarget, incompatible: [], totalChecked: 0 };
  }

  const bundles = profilePkg.dsh?.profile?.bundles || [];
  const dependencies = profilePkg.dependencies || {};

  let appBoot = null;
  let semver = null;
  const dshPkgPaths = [
    '/opt/homebrew/lib/node_modules/@deepseek-ai/dsh/package.json',
    path.join(os.homedir(), '.local/lib/node_modules/@deepseek-ai/dsh/package.json'),
    '/usr/local/lib/node_modules/@deepseek-ai/dsh/package.json'
  ];
  for (const p of dshPkgPaths) {
    if (fs.existsSync(p)) {
      try {
        const req = createRequire(p);
        appBoot = req('@deepseek-ai/dsh-app-boot');
        semver = req('semver');
        break;
      } catch (e) {}
    }
  }

  let exemptions = {};
  if (appBoot && typeof appBoot.readProfileCompatibility === 'function') {
    try {
      exemptions = appBoot.readProfileCompatibility(profileDir).exemptions || {};
    } catch (e) {}
  }

  const incompatible = [];
  let totalChecked = 0;

  for (const bundle of bundles) {
    if (bundle.startsWith('@deepseek-ai/')) continue;
    totalChecked++;

    let pluginPkgPath = path.join(profileDir, 'node_modules', bundle, 'package.json');
    if (dependencies[bundle]?.startsWith('link:')) {
      const linkPath = dependencies[bundle].slice(5);
      pluginPkgPath = path.join(linkPath, 'package.json');
    }

    if (!fs.existsSync(pluginPkgPath)) continue;

    try {
      const pluginPkg = JSON.parse(fs.readFileSync(pluginPkgPath, 'utf8'));
      const pluginVer = pluginPkg.version || dependencies[bundle] || 'unknown';

      let isMismatch = false;
      let reason = '';
      let requiredRange = '';

      if (appBoot && typeof appBoot.evaluatePluginCompatibility === 'function') {
        const rawRes = appBoot.evaluatePluginCompatibility(pluginPkg, {}, cleanTarget);
        if (rawRes) {
          const key1 = `${pluginPkg.name}@${pluginVer}`;
          const key2 = `${bundle}@${pluginVer}`;
          const isExempted = (exemptions[key1] || exemptions[key2])?.includes(cleanTarget) === true;
          if (!isExempted) {
            isMismatch = true;
            const peerEntries = Object.entries(rawRes.peers || {});
            if (peerEntries.length > 3) {
              const sample = peerEntries.slice(0, 3).map(([k]) => k.replace('@deepseek-ai/dsh-', '').replace('@deepseek-ai/', '')).join(', ');
              requiredRange = `${sample} 等 ${peerEntries.length} 项 DSH 组件未适配`;
            } else if (peerEntries.length > 0) {
              requiredRange = peerEntries.map(([k, v]) => `${k.replace('@deepseek-ai/dsh-', '').replace('@deepseek-ai/', '')}: ${v}`).join(', ');
            } else {
              requiredRange = `与 DSH ${cleanTarget} 版本未适配`;
            }
            reason = requiredRange;
          }
        }
      } else if (semver) {
        const key1 = `${pluginPkg.name}@${pluginVer}`;
        const key2 = `${bundle}@${pluginVer}`;
        const isExempted = (exemptions[key1] || exemptions[key2])?.includes(cleanTarget) === true;
        if (!isExempted) {
          const peers = pluginPkg.peerDependencies || {};
          for (const [pName, pRange] of Object.entries(peers)) {
            if (pName === '@deepseek-ai/dsh' || pName.startsWith('@deepseek-ai/dsh-')) {
              if (!semver.satisfies(cleanTarget, pRange, { includePrerelease: true })) {
                isMismatch = true;
                requiredRange = pRange;
                reason = `要求 ${pName.replace('@deepseek-ai/', '')}: ${pRange}`;
                break;
              }
            }
          }
          if (!isMismatch && pluginPkg.engines?.dsh) {
            if (!semver.satisfies(cleanTarget, pluginPkg.engines.dsh, { includePrerelease: true })) {
              isMismatch = true;
              requiredRange = pluginPkg.engines.dsh;
              reason = `engines.dsh 要求 ${pluginPkg.engines.dsh}`;
            }
          }
        }
      }

      if (isMismatch) {
        incompatible.push({
          bundle,
          name: pluginPkg.name || bundle,
          version: pluginVer,
          requiredRange,
          reason
        });
      }
    } catch (e) {}
  }

  return {
    targetVersion: cleanTarget,
    incompatible,
    totalChecked
  };
}

// Run upgrade execution
async function executeUpgrade(targetVer) {
  taskState.running = true;
  taskState.targetVersion = targetVer;
  taskState.currentVersion = getCurrentVersion();
  taskState.error = null;
  taskState.logs = [];
  taskState.startedAt = Date.now();

  addLog(`准备开始升级 DSH: ${taskState.currentVersion} -> ${targetVer}`);

  // Step 1: Backup profile
  taskState.step = 'backing_up';
  addLog('第 1 步: 正在备份用户配置 profile 到临时目录...');
  const ts = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const backupFile = `/tmp/dsh-profile-web-pre${targetVer.replace(/[^a-zA-Z0-9]/g, '')}-${ts}.tgz`;
  const profilesDir = path.join(os.homedir(), '.dsh/profiles');

  try {
    await new Promise((resolve, reject) => {
      execFile('tar', ['-czf', backupFile, '-C', profilesDir, 'web'], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    taskState.backupPath = backupFile;
    addLog(`配置备份成功: ${backupFile}`);
  } catch (backupErr) {
    addLog(`配置备份警告 (非致命): ${backupErr.message}`);
  }

  // Step 1.5: Incompatible plugin safety handling
  const comp = checkPluginsCompatibility(targetVer);
  if (comp.incompatible && comp.incompatible.length > 0) {
    addLog(`第 1.5 步: 兼容性防护 - 检测到 ${comp.incompatible.length} 个插件尚未适配目标 DSH 版本:`);
    for (const item of comp.incompatible) {
      addLog(`  • ${item.bundle}@${item.version} (${item.reason})`);
    }

    try {
      const profileDir = path.join(os.homedir(), '.dsh/profiles/web');
      const pkgPath = path.join(profileDir, 'package.json');
      const pData = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const origBundles = pData.dsh?.profile?.bundles || [];
      const incompSet = new Set(comp.incompatible.map((i) => i.bundle));

      const newBundles = origBundles.filter((b) => !incompSet.has(b));
      pData.dsh.profile.bundles = newBundles;
      fs.writeFileSync(pkgPath, JSON.stringify(pData, null, 2) + '\n', 'utf8');

      // Record disabled incompatible plugins
      const recordPath = path.join(profileDir, '.dsh-disabled-incompatible.json');
      const recordData = {
        targetVersion: targetVer,
        disabledAt: new Date().toISOString(),
        plugins: comp.incompatible
      };
      fs.writeFileSync(recordPath, JSON.stringify(recordData, null, 2) + '\n', 'utf8');

      addLog(`已自动从启动项关闭 ${comp.incompatible.length} 个不兼容插件，等待其更新兼容。`);
    } catch (disableErr) {
      addLog(`兼容性防护警告: 自动停用插件失败: ${disableErr.message}`);
    }
  }

  // Auto-sanitize webserver host if 0.0.0.0
  try {
    const profileDir = path.join(os.homedir(), '.dsh/profiles/web');
    const patchPath = path.join(profileDir, 'cordis.patch.yml');
    if (fs.existsSync(patchPath)) {
      let patchContent = fs.readFileSync(patchPath, 'utf8');
      if (patchContent.includes("host: '0.0.0.0'") || patchContent.includes('host: "0.0.0.0"') || patchContent.includes('host: 0.0.0.0')) {
        patchContent = patchContent.replace(/host:\s*['"]?0\.0\.0\.0['"]?/g, "host: '127.0.0.1'");
        fs.writeFileSync(patchPath, patchContent, 'utf8');
        addLog(`已自动将 webserver.host 从 0.0.0.0 调整为 127.0.0.1，满足新版本安全规范。`);
      }
    }
  } catch (e) {}

  // Step 2: npm install
  taskState.step = 'installing';
  const npmBin = getNpmBin();
  const installArg = `@deepseek-ai/dsh@${targetVer}`;
  addLog(`第 2 步: 执行全局 npm 安装: ${npmBin} install -g ${installArg}`);

  const child = spawn(npmBin, ['install', '-g', installArg], {
    env: {
      ...process.env,
      PATH: `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${process.env.PATH || ''}`
    }
  });

  child.stdout.on('data', (d) => {
    const lines = d.toString().split('\n').filter(Boolean);
    for (const l of lines) addLog(`[npm] ${l}`);
  });

  child.stderr.on('data', (d) => {
    const lines = d.toString().split('\n').filter(Boolean);
    for (const l of lines) addLog(`[npm err] ${l}`);
  });

  const exitCode = await new Promise((resolve) => {
    child.on('close', resolve);
    child.on('error', (err) => {
      addLog(`[npm fatal] ${err.message}`);
      resolve(1);
    });
  });

  if (exitCode !== 0) {
    taskState.step = 'error';
    taskState.running = false;
    taskState.error = `npm 安装失败，退出码 ${exitCode}`;
    addLog(`升级中止: npm 安装未正常完成，保持原版本不变。`);
    return;
  }

  addLog(`npm 安装成功！已就绪新版本: ${targetVer}`);
  recordUpgradeNotes(taskState.currentVersion, targetVer, taskState.backupPath);

  // Step 3: Trigger restart
  taskState.step = 'restarting';
  addLog('第 3 步: 正在通知后台服务 (launchctl) 重启加载新版本...');
  triggerRestartService(800, addLog);
}

export function apply(ctx) {
  ctx.webServer.register({
    kind: 'prefix',
    path: '/api/dsh-upgrade',
    handler: async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      const urlObj = new URL(req.url, 'http://localhost');
      const pathname = urlObj.pathname;

      // 1. GET /api/dsh-upgrade/info
      if (req.method === 'GET' && (pathname === '/api/dsh-upgrade/info' || pathname === '/api/dsh-upgrade')) {
        const currentVersion = getCurrentVersion();
        const forceCheck = urlObj.searchParams.get('refresh') === 'true';

        let registryData = null;
        let queryError = null;
        try {
          registryData = await fetchRemoteRegistry(forceCheck);
        } catch (e) {
          queryError = e.message;
        }

        const distTags = registryData?.['dist-tags'] || {};
        let latestVersion = distTags.latest || currentVersion;
        let alphaVersion = distTags.alpha || null;
        const nextVersion = distTags.next || null;

        const allVersions = registryData ? Object.keys(registryData.versions || {}) : [];
        const timeMap = registryData?.time || {};

        // Sort descending
        const sortedVersions = allVersions.sort((a, b) => compareSemver(b, a));

        // Detect highest stable and highest alpha across all versions
        if (sortedVersions.length > 0) {
          const firstNonAlpha = sortedVersions.find((v) => !v.includes('-alpha') && !v.includes('-beta'));
          if (firstNonAlpha && (!distTags.latest || compareSemver(firstNonAlpha, latestVersion) > 0)) {
            latestVersion = firstNonAlpha;
          }
          const firstAlpha = sortedVersions.find((v) => v.includes('-alpha') || v.includes('-beta'));
          if (firstAlpha && (!alphaVersion || compareSemver(firstAlpha, alphaVersion) > 0)) {
            alphaVersion = firstAlpha;
          }
        }

        const hasUpdate = compareSemver(currentVersion, latestVersion) < 0;
        const hasAlphaUpdate = alphaVersion ? compareSemver(currentVersion, alphaVersion) < 0 : false;

        const versionList = sortedVersions.slice(0, 35).map((v) => ({
          version: v,
          time: timeMap[v] || '',
          tag: v === latestVersion ? 'latest' : (v === alphaVersion ? 'alpha' : (v === nextVersion ? 'next' : '')),
          channel: (v.includes('-alpha') || v.includes('-beta')) ? 'alpha' : 'stable'
        }));

        const checkTarget = urlObj.searchParams.get('target') || (hasUpdate ? latestVersion : (hasAlphaUpdate ? alphaVersion : currentVersion));
        const compatibility = checkPluginsCompatibility(checkTarget);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: true,
          currentVersion,
          latestVersion,
          alphaVersion,
          nextVersion,
          hasUpdate,
          hasAlphaUpdate,
          hasAnyUpdate: hasUpdate || hasAlphaUpdate,
          versionList,
          compatibility,
          queryError,
          uptime: process.uptime(),
          pid: process.pid,
          nodeVersion: process.version,
          npmBin: getNpmBin()
        }));
        return;
      }

      // 1.5. GET /api/dsh-upgrade/compatibility?target=<version>
      if (req.method === 'GET' && pathname === '/api/dsh-upgrade/compatibility') {
        const target = urlObj.searchParams.get('target') || getCurrentVersion();
        const comp = checkPluginsCompatibility(target);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: true,
          ...comp
        }));
        return;
      }

      // 2. POST /api/dsh-upgrade/start
      if (req.method === 'POST' && pathname === '/api/dsh-upgrade/start') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', async () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            let targetVersion = parsed.version;

            if (!targetVersion || targetVersion === 'latest') {
              try {
                const reg = await fetchRemoteRegistry(false);
                targetVersion = reg['dist-tags']?.latest || 'latest';
              } catch (e) {
                targetVersion = 'latest';
              }
            }

            if (typeof targetVersion === 'string') {
              targetVersion = targetVersion.trim().replace(/^v/, '');
            }

            if (!targetVersion) {
              res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ ok: false, error: '目标版本号无效，不能为空' }));
              return;
            }

            if (taskState.running) {
              res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ ok: false, error: '升级任务已在进行中，请勿重复发起' }));
              return;
            }

            // Fire and forget execution
            executeUpgrade(targetVersion).catch((err) => {
              taskState.step = 'error';
              taskState.running = false;
              taskState.error = err.message;
              addLog(`[fatal] 升级异常: ${err.message}`);
            });

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              ok: true,
              message: `升级任务已启动，目标版本: ${targetVersion}`,
              targetVersion
            }));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: false, error: '请求解析失败: ' + e.message }));
          }
        });
        return;
      }

      // 3. GET /api/dsh-upgrade/status
      if (req.method === 'GET' && pathname === '/api/dsh-upgrade/status') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: true,
          ...taskState,
          currentVersion: getCurrentVersion()
        }));
        return;
      }

      // 4. POST /api/dsh-upgrade/reset
      if (req.method === 'POST' && pathname === '/api/dsh-upgrade/reset') {
        taskState.running = false;
        taskState.step = 'idle';
        taskState.error = null;
        taskState.logs = [];
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, message: '状态已重置' }));
        return;
      }

      // 5. GET /api/dsh-upgrade/ping (or /api/dsh-restart)
      if (req.method === 'GET' && (pathname === '/api/dsh-upgrade/ping' || pathname === '/api/dsh-restart')) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: true,
          status: 'running',
          version: getCurrentVersion(),
          uptime: process.uptime(),
          pid: process.pid,
          time: Date.now()
        }));
        return;
      }

      // 6. POST /api/dsh-upgrade/restart (or /api/dsh-restart)
      if (req.method === 'POST' && (pathname === '/api/dsh-upgrade/restart' || pathname === '/api/dsh-restart')) {
        if (taskState.running) {
          res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: '升级安装任务正在进行中，请等待完成后再重启' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: true,
          message: 'DSH 服务正在重启...'
        }));

        triggerRestartService(250);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });
}
