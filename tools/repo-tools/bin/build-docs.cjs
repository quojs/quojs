#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

/**
 * TypeDoc JSON → UI-focused shards
 * - Normalizes symbols (public/exported only)
 * - Flattens signatures/members
 * - Extracts summary, remarks, examples, since/deprecated
 * - Writes:
 *   - <out>/<package>/symbols/<modulePath>/<symbol>.json
 *   - <out>/<package>/api-index.json */

const fs = require('fs');
const path = require('path');

const args = parseArgs(process.argv.slice(2));
if (!args.input || !args.out) {
  console.error('Usage: node build-docs.cjs --input <typedoc.json> --out <outputDir> [--package <name>]');
  process.exit(1);
}

const INPUT = path.resolve(process.cwd(), args.input);
const OUT_DIR = path.resolve(process.cwd(), args.out);
const PACKAGE_NAME = args.package || inferPackageName(INPUT);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--input') out.input = argv[++i];
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--package') out.package = argv[++i];
    else if (a.startsWith('--')) {
      const [k, v] = a.replace(/^--/, '').split('=');
      out[k] = v ?? true;
    }
  }
  return out;
}

function inferPackageName(file) {
  const base = path.basename(file).replace(/\.[^.]+$/, '');
  return base.toLowerCase();
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeJSON(file, obj) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(obj, null, 2), 'utf8');
}

function slugify(s) {
  return String(s)
    .trim()
    .replace(/[/\\]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function first(arr) {
  return Array.isArray(arr) && arr.length ? arr[0] : undefined;
}

// Join TypeDoc rich text array into a plain string
function joinParts(parts) {
  if (!Array.isArray(parts)) return '';
  return parts
    .map(p => {
      if (typeof p === 'string') return p;
      if (!p) return '';
      // typedoc 0.28 uses { kind: 'text'|'code'|..., text: string }
      if (p.text != null) return p.text;
      if (p.code != null) return p.code;
      // fallback if different shape
      return (p.kind && p.kind.toUpperCase() === 'CODE' && p.text) ? p.text : '';
    })
    .join('');
}

function getKind(node) {
  // Prefer kindString if present; fallback to numeric kind classification
  if (node.kindString) return node.kindString;
  // Fallback map (partial) in case kindString missing
  const map = {
    1: 'Project',
    2: 'Module',
    4: 'Namespace',
    16: 'Enum',
    32: 'Enum member',
    64: 'Variable',
    128: 'Class',
    256: 'Interface',
    512: 'Function',
    1024: 'Property',
    2048: 'Method',
    4096: 'Constructor',
    65536: 'Type alias',
    4194304: 'Call signature' // etc.
  };
  return map[node.kind] || `kind:${node.kind}`;
}

function isHidden(node) {
  const tags = (node.comment && node.comment.blockTags) || [];
  return tags.some(t => t.tag === '@internal' || t.tag === '@hidden');
}

function isPublic(node) {
  const flags = node.flags || {};
  if (flags.isPrivate || flags.isProtected) return false;
  if (isHidden(node)) return false;
  return true;
}

function isExported(node) {
  const flags = node.flags || {};
  if (flags.isExported) return true;
  // If the node has its own document (top-level) and is public, consider exported.
  // Also accept classes/interfaces/functions at top-level modules.
  return !!flags.hasOwnDocument || !!node.sources || getKind(node) === 'Module';
}

function allowedTopLevelKind(kindString) {
  const k = String(kindString).toLowerCase();
  return (
    k === 'module' ||
    k === 'namespace' ||
    k === 'class' ||
    k === 'interface' ||
    k === 'function' ||
    k === 'enum' ||
    k === 'variable' ||
    k === 'type alias'
  );
}

function extractCommentBits(comment) {
  const out = {
    summary: '',
    remarks: '',
    deprecated: '',
    since: [],
    see: [],
    examples: []
  };
  if (!comment) return out;

  // summary (first sentence)
  const sum = joinParts(comment.summary);
  out.summary = (sum || '').trim();

  const tags = comment.blockTags || [];

  function getTagText(tagName) {
    const t = tags.find(t => t.tag === tagName);
    if (!t) return '';
    return joinParts(t.content || []).trim();
  }

  function getAllTagText(tagName) {
    return tags
      .filter(t => t.tag === tagName)
      .map(t => joinParts(t.content || []).trim())
      .filter(Boolean);
  }

  out.remarks = getTagText('@remarks');
  out.deprecated = getTagText('@deprecated');
  out.since = getAllTagText('@since');
  out.see = getAllTagText('@see');

  // examples: try to preserve code fences if present in content
  const exampleBlocks = tags.filter(t => t.tag === '@example');
  out.examples = exampleBlocks
    .map(b => {
      const text = joinParts(b.content || []);
      // Heuristic: if content already contains a fence, keep as-is; else wrap in ts fence
      const code = /```/.test(text) ? text : '```ts\n' + text.trim() + '\n```';
      return { code };
    })
    .filter(e => e.code && e.code.trim());

  return out;
}

function extractParamDocs(sig) {
  const out = {};
  const tags = sig?.comment?.blockTags || [];
  for (const t of tags) {
    if (t.tag === '@param') {
      const raw = joinParts(t.content || []);
      // common styles: "paramName - description" OR "paramName description"
      const match = raw.match(/^\s*([\w$]+)\s*[-–:]\s*(.+)$/) || raw.match(/^\s*([\w$]+)\s+(.+)$/);
      if (match) {
        out[match[1]] = match[2].trim();
      }
    }
  }
  return out;
}

function extractReturnsDoc(sig) {
  const t = (sig?.comment?.blockTags || []).find(t => t.tag === '@returns');
  return t ? joinParts(t.content || []).trim() : '';
}

function typeToString(t) {
  if (!t) return 'unknown';

  // string union of some TypeDoc type node shapes
  switch (t.type) {
    case 'intrinsic':
      return t.name; // e.g., string, number
    case 'reference': {
      const name = t.name || 'unknown';
      const typeArgs = t.typeArguments ? `<${t.typeArguments.map(typeToString).join(', ')}>` : '';
      return t.package ? `${t.package}.${name}${typeArgs}` : `${name}${typeArgs}`;
    }
    case 'array':
      return `${typeToString(t.elementType)}[]`;
    case 'union':
      return t.types.map(typeToString).join(' | ');
    case 'intersection':
      return t.types.map(typeToString).join(' & ');
    case 'literal':
      if (typeof t.value === 'string') return JSON.stringify(t.value);
      return String(t.value);
    case 'tuple':
      return `[${(t.elements || []).map(typeToString).join(', ')}]`;
    case 'reflection': {
      // object/func type
      const decl = t.declaration || {};
      const sigs = decl.signatures || [];
      if (sigs.length) {
        // function type like (a: A) => R
        return signatureToShortString(sigs[0]);
      }
      const children = decl.children || [];
      if (children.length) {
        const body = children
          .filter(isPublic)
          .map((c) => `${c.name}${c.flags?.isOptional ? '?' : ''}: ${typeToString(c.type)}`)
          .join('; ');
        return `{ ${body} }`;
      }
      return 'object';
    }
    case 'predicate':
      return `${t.asserts ? 'asserts ' : ''}${t.name} is ${typeToString(t.targetType)}`;
    case 'query':
      return `typeof ${typeToString(t.queryType)}`;
    case 'conditional':
      return `${typeToString(t.checkType)} extends ${typeToString(t.extendsType)} ? ${typeToString(t.trueType)} : ${typeToString(t.falseType)}`;
    case 'indexedAccess':
      return `${typeToString(t.objectType)}[${typeToString(t.indexType)}]`;
    case 'templateLiteral': {
      const head = t.head || '';
      const tail = t.tail || [];
      const parts = [head];

      for (const seg of tail) {
        parts.push('${' + typeToString(seg.type) + '}');
        parts.push(seg.text || '');
      }

      return '`' + parts.join('') + '`';
    }
    case 'namedTupleMember':
      return `${t.name}: ${typeToString(t.element)}`;
    default:
      // Fallback
      return t.name || JSON.stringify(t);
  }
}

function typeParamsToChips(tpArr) {
  if (!Array.isArray(tpArr) || !tpArr.length) return [];
  return tpArr.map(tp => ({
    name: tp.name,
    constraint: tp.constraint ? typeToString(tp.constraint) : undefined,
    default: tp.default ? typeToString(tp.default) : undefined
  }));
}

// Short function type like: <T>(a: A, b?: B) => R
function signatureToShortString(sig) {
  const tps = sig.typeParameters ? `<${sig.typeParameters.map(tp => tp.name).join(', ')}>` : '';
  const params = (sig.parameters || []).map(p => {
    const rest = p.rest ? '...' : '';
    const opt = p.flags?.isOptional ? '?' : '';
    const name = p.name || 'arg';

    return `${rest}${name}${opt}: ${typeToString(p.type)}`;
  }).join(', ');

  const ret = typeToString(sig.type);

  return `${tps}(${params}) => ${ret}`;
}

function extractParams(sig) {
  const paramDocs = extractParamDocs(sig);

  return (sig.parameters || []).map(p => ({
    name: p.name,
    rest: !!p.rest,
    optional: !!(p.flags && p.flags.isOptional),
    type: typeToString(p.type),
    default: p.defaultValue || undefined,
    doc: paramDocs[p.name] || ''
  }));
}

function extractSignatures(node) {
  // functions, methods, constructors may have one or more signatures
  const sigs = node.signatures || node.signatures?.length ? node.signatures : node?.implementationOf?.signatures;
  const arr = Array.isArray(sigs) ? sigs : [];

  return arr.map(sig => ({
    text: signatureToShortString(sig),
    parameters: extractParams(sig),
    returns: {
      type: typeToString(sig.type),
      doc: extractReturnsDoc(sig)
    },
    typeParams: typeParamsToChips(sig.typeParameters),
    comment: extractCommentBits(sig.comment)
  }));
}

function extractClassOrInterfaceMembers(node) {
  const children = node.children || [];
  const out = [];

  for (const c of children) {
    if (!isPublic(c)) continue;
    const kind = getKind(c);
    if (kind === 'Constructor') {
      const sigs = extractSignatures(c);
      out.push({
        kind: 'constructor',
        name: 'constructor',
        signatures: sigs
      });
      continue;
    }
    if (kind === 'Method') {
      out.push({
        kind: 'method',
        name: c.name,
        typeParams: typeParamsToChips(c.typeParameters),
        signatures: extractSignatures(c),
        comment: extractCommentBits(c.comment)
      });
      continue;
    }
    if (kind === 'Property' || kind === 'Accessor') {
      out.push({
        kind: 'property',
        name: c.name,
        optional: !!c.flags?.isOptional,
        readonly: !!c.flags?.isReadonly,
        type: typeToString(c.type || c.getSignature?.type),
        comment: extractCommentBits(c.comment)
      });

      continue;
    }
  }

  return out;
}

function buildIndexMaps(root) {
  const byId = new Map();
  const parentOf = new Map();

  (function visit(n, parent) {
    byId.set(n.id, n);

    if (parent) parentOf.set(n.id, parent.id);
    if (Array.isArray(n.children)) n.children.forEach(ch => visit(ch, n));
    if (Array.isArray(n.groups)) {
      // groups are structural metadata; ignore for traversal
    }
  })(root, null);

  return { byId, parentOf };
}

function buildFQName(node, byId, parentOf) {
  const names = [];
  let cur = node;

  while (cur) {
    names.push(cur.name);
    const pid = parentOf.get(cur.id);

    if (!pid) break;
    cur = byId.get(pid);
    // Stop at project root
    if (!cur || getKind(cur) === 'Project') break;
  }

  // reverse: we want module/namespace path + symbol
  names.reverse();
  // Remove project name if present
  if (names.length > 1 && getKind(byId.get(parentOf.get(node.id))) === 'Project') {
    // keep as-is
  }

  return names.join('.');
}

function modulePathFor(node, byId, parentOf) {
  // Build a path of parent names for Module/Namespace nodes only
  const segs = [];
  let cur = node;

  while (cur) {
    const pid = parentOf.get(cur.id);
    const parent = pid ? byId.get(pid) : null;

    if (!parent) break;
    if (getKind(parent) === 'Module' || getKind(parent) === 'Namespace') {
      segs.push(parent.name);
    }

    cur = parent;
  }

  segs.reverse();

  return segs.join('/');
}

function symbolOutputPath(baseOut, pkg, modulePath, nodeName, nodeId) {
  const mod = modulePath ? `${modulePath}/` : '';
  const file = `${slugify(nodeName)}-${nodeId}.json`; // id guard against collisions

  return path.join(baseOut, pkg, 'symbols', mod, file);
}

function relativeSymbolRoute(pkg, modulePath, nodeName, nodeId) {
  const mod = modulePath ? `${modulePath}/` : '';

  return `${pkg}/symbols/${mod}${slugify(nodeName)}-${nodeId}.json`;
}

function normalizeNode(node, byId, parentOf) {
  const kindString = getKind(node);
  const fqName = buildFQName(node, byId, parentOf);
  const modulePath = modulePathFor(node, byId, parentOf);

  const comment = extractCommentBits(node.comment);
  const source0 = first(node.sources) || {};
  const source = source0.fileName
    ? { file: source0.fileName, line: source0.line, url: source0.url }
    : undefined;

  const base = {
    id: node.id,
    name: node.name,
    fqName,
    kind: kindString.toLowerCase().replace(/\s+/g, ''), // 'typealias', 'function', etc.
    package: PACKAGE_NAME,
    modulePath,
    exported: isExported(node),
    tags: {
      deprecated: comment.deprecated || undefined,
      since: comment.since?.length ? comment.since : undefined,
      see: comment.see?.length ? comment.see : undefined
    },
    summary: comment.summary,
    remarks: comment.remarks,
    examples: comment.examples,
    source
  };

  // Signatures (for function-like top-levels)
  let signatures = [];
  if (Array.isArray(node.signatures)) {
    signatures = extractSignatures(node);
  }

  // Members (for classes/interfaces)
  let members = [];
  if (kindString === 'Class' || kindString === 'Interface') {
    members = extractClassOrInterfaceMembers(node);
  }

  // Generics on top-level
  const typeParams = typeParamsToChips(node.typeParameters || node.typeParameter);

  // Inheritance
  const heritage = {
    extends: (node.extendedTypes || []).map(typeToString),
    implements: (node.implementedTypes || []).map(typeToString),
    implementedBy: (node.implementedBy || []).map(typeToString)
  };

  if (!heritage.extends.length) delete heritage.extends;
  if (!heritage.implements.length) delete heritage.implements;
  if (!heritage.implementedBy || !heritage.implementedBy.length) delete heritage.implementedBy;

  const out = {
    ...base,
    typeParams: typeParams.length ? typeParams : undefined,
    signatures: signatures.length ? signatures : undefined,
    members: members.length ? members : undefined,
    heritage: Object.keys(heritage).length ? heritage : undefined
  };

  return out;
}

function scoreNodeForIndex(n) {
  let score = 0;
  if (n.summary) score += 2;
  if (n.remarks) score += 1;
  if (n.examples && n.examples.length) score += 2;
  if (n.signatures && n.signatures.length) score += 1;
  if (n.members && n.members.length) score += 1;
  if (n.tags?.deprecated) score -= 2;

  return score;
}

function main() {
  const raw = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  const { byId, parentOf } = buildIndexMaps(raw);

  const topLevel = [];
  for (const n of byId.values()) {
    const kind = getKind(n);

    if (!allowedTopLevelKind(kind)) continue;
    if (!isPublic(n)) continue;
    if (!isExported(n)) continue;

    // Avoid project root & intermediate reflection-only nodes
    if (kind === 'Project') continue;

    // Skip modules with no public children
    topLevel.push(n);
  }

  const symbolRecords = [];
  let written = 0;

  for (const node of topLevel) {
    // Only real symbol-bearing nodes (skip empty modules/namespaces unless they carry docs)
    const kind = getKind(node);
    const hasDocs = !!(node.comment && (joinParts(node.comment.summary) || (node.comment.blockTags || []).length));
    const hasChildren = Array.isArray(node.children) && node.children.some(isPublic);

    const isSymbol =
      kind === 'Class' ||
      kind === 'Interface' ||
      kind === 'Function' ||
      kind === 'Enum' ||
      kind === 'Variable' ||
      kind === 'Type alias';

    if (!isSymbol && !hasDocs && !hasChildren) {
      // A module/namespace without docs nor children we care about — skip
      continue;
    }

    if (isSymbol) {
      const norm = normalizeNode(node, byId, parentOf);
      const modPath = modulePathFor(node, byId, parentOf);
      const outPath = symbolOutputPath(OUT_DIR, PACKAGE_NAME, modPath, node.name, node.id);

      writeJSON(outPath, norm);
      symbolRecords.push({
        id: norm.id,
        name: norm.name,
        kind: norm.kind,
        fqName: norm.fqName,
        package: norm.package,
        modulePath: norm.modulePath,
        summary: norm.summary,
        deprecated: !!norm.tags?.deprecated,
        since: norm.tags?.since,
        route: relativeSymbolRoute(PACKAGE_NAME, modPath, node.name, node.id),
        score: scoreNodeForIndex(norm)
      });

      written++;
      continue;
    }

    // Optionally: write module/namespace pages if they have a comment
    if ((kind === 'Module' || kind === 'Namespace') && hasDocs) {
      const norm = normalizeNode(node, byId, parentOf);
      const modPath = modulePathFor(node, byId, parentOf);
      const outPath = symbolOutputPath(OUT_DIR, PACKAGE_NAME, modPath, node.name, node.id);

      writeJSON(outPath, norm);
      symbolRecords.push({
        id: norm.id,
        name: norm.name,
        kind: norm.kind,
        fqName: norm.fqName,
        package: norm.package,
        modulePath: norm.modulePath,
        summary: norm.summary,
        deprecated: !!norm.tags?.deprecated,
        since: norm.tags?.since,
        route: relativeSymbolRoute(PACKAGE_NAME, modPath, node.name, node.id),
        score: scoreNodeForIndex(norm)
      });

      written++;
    }
  }

  // Build api-index.json
  symbolRecords.sort((a, b) => {
    // by score desc, then kind priority, then name
    const kd = kindRank(a.kind) - kindRank(b.kind);

    if (b.score !== a.score) return b.score - a.score;
    if (kd !== 0) return kd;
    
    return a.name.localeCompare(b.name);
  });

  const index = {
    package: PACKAGE_NAME,
    generatedAt: new Date().toISOString(),
    totalSymbols: symbolRecords.length,
    symbols: symbolRecords
  };

  const indexPath = path.join(OUT_DIR, PACKAGE_NAME, 'api-index.json');
  writeJSON(indexPath, index);

  console.log(`✅ Wrote ${written} symbol files and api-index.json to ${path.relative(process.cwd(), path.join(OUT_DIR, PACKAGE_NAME))}`);
}

function kindRank(kind) {
  // Controls grouping order in nav/search
  const order = [
    'class',
    'interface',
    'function',
    'typealias',
    'enum',
    'variable',
    'module',
    'namespace'
  ];
  const i = order.indexOf(kind);
  return i === -1 ? 999 : i;
}

// Run
try {
  main();
} catch (err) {
  console.error('❌ Failed:', err?.stack || err?.message || err);
  process.exit(1);
}
