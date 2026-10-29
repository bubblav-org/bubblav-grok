#!/usr/bin/env node
/**
 * Validator for the BubblaV Grok plugin (single-plugin repo).
 *
 * Checks the invariants the Grok and Grok Bot marketplace reviews care about:
 *   - .grok-plugin/plugin.json and .cursor-plugin/plugin.json are valid JSON
 *     with the same kebab-case name and version
 *   - the logo is committed and referenced by a relative path
 *   - .mcp.json declares only the BubblaV remote MCP server
 *   - every skill has SKILL.md with name + description frontmatter
 *
 * Run from the repository root:  node scripts/validate-plugin.mjs
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const errors = [];

const pluginNamePattern = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const MCP_URL = 'https://www.bubblav.com/mcp';

async function readJson(rel) {
  let raw;
  try {
    raw = await fs.readFile(path.join(repoRoot, rel), 'utf8');
  } catch {
    errors.push(`${rel} is missing.`);
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    errors.push(`${rel} contains invalid JSON: ${err.message}`);
    return null;
  }
}

async function exists(rel) {
  try {
    await fs.access(path.join(repoRoot, rel));
    return true;
  } catch {
    return false;
  }
}

function isRelative(p) {
  return typeof p === 'string' && !path.isAbsolute(p) && !p.split(/[\\/]/).includes('..');
}

const manifests = {};
for (const rel of ['.grok-plugin/plugin.json', '.cursor-plugin/plugin.json']) {
  const m = await readJson(rel);
  if (!m) continue;
  manifests[rel] = m;
  if (!m.name || !pluginNamePattern.test(m.name)) errors.push(`${rel}: "name" must be kebab-case (got ${JSON.stringify(m.name)}).`);
  if (!m.version) errors.push(`${rel}: "version" is required.`);
  if (!m.description) errors.push(`${rel}: "description" is required.`);
  if (!m.license) errors.push(`${rel}: "license" is required.`);
  if (m.logo !== undefined) {
    if (!isRelative(m.logo)) errors.push(`${rel}: "logo" must be a relative path inside the repo.`);
    else if (!(await exists(m.logo))) errors.push(`${rel}: "logo" references a missing file: ${m.logo}`);
  }
  for (const key of ['mcpServers', 'skills']) {
    if (m[key] !== undefined && !isRelative(m[key])) errors.push(`${rel}: "${key}" must be a relative path inside the repo.`);
  }
}

const [grok, cursor] = [manifests['.grok-plugin/plugin.json'], manifests['.cursor-plugin/plugin.json']];
if (grok && cursor) {
  if (grok.name !== cursor.name) errors.push('Manifest names differ between .grok-plugin and .cursor-plugin.');
  if (grok.version !== cursor.version) errors.push('Manifest versions differ between .grok-plugin and .cursor-plugin.');
}

const marketplace = await readJson('.grok-plugin/marketplace.json');
if (marketplace && grok) {
  const entry = marketplace.plugins?.find((p) => p.name === grok.name);
  if (!entry) errors.push(`.grok-plugin/marketplace.json: no entry named "${grok.name}".`);
}

const mcp = await readJson('.mcp.json');
if (mcp) {
  const servers = mcp.mcpServers ?? {};
  const names = Object.keys(servers);
  if (names.length !== 1 || names[0] !== 'bubblav') errors.push('.mcp.json: expected exactly one server, "bubblav".');
  const server = servers.bubblav;
  if (server && server.url !== MCP_URL) errors.push(`.mcp.json: "bubblav.url" must be ${MCP_URL}.`);
  if (server && 'command' in server) errors.push('.mcp.json: "bubblav" must be a remote server (no "command").');
  if (server && /\$\{/.test(JSON.stringify(server))) errors.push('.mcp.json: no ${VAR} placeholders allowed.');
}

const skillsDir = path.join(repoRoot, 'skills');
const skillDirs = (await fs.readdir(skillsDir, { withFileTypes: true })).filter((d) => d.isDirectory());
if (skillDirs.length === 0) errors.push('skills/: no skills found.');
for (const dir of skillDirs) {
  const rel = `skills/${dir.name}/SKILL.md`;
  let text;
  try {
    text = await fs.readFile(path.join(repoRoot, rel), 'utf8');
  } catch {
    errors.push(`${rel} is missing.`);
    continue;
  }
  const front = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? '';
  if (!new RegExp(`^name: ${dir.name}$`, 'm').test(front)) errors.push(`${rel}: frontmatter "name" must be "${dir.name}".`);
  if (!/^description: .+/m.test(front)) errors.push(`${rel}: frontmatter "description" is required.`);
}

if (errors.length > 0) {
  console.error('Plugin validation failed:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`OK: ${grok?.name}@${grok?.version}, ${skillDirs.length} skills, MCP ${MCP_URL}`);
