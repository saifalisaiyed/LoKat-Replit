#!/usr/bin/env node
/**
 * Extract StyleSheet.create blocks into separate .styles.ts files.
 * Usage: node scripts/extract-styles.mjs <file1> <file2> ...
 */

import { readFileSync, writeFileSync } from 'fs';
import { basename, extname } from 'path';

function findStylesBlock(content) {
  const pattern = /const\s+(\w+)\s*=\s*StyleSheet\.create\(/;
  const match = pattern.exec(content);
  if (!match) return null;

  const varName = match[1];
  const start = match.index;
  let i = match.index + match[0].length; // right after opening '('
  let depth = 1;
  let inStr = false;
  let strChar = null;

  while (i < content.length) {
    const c = content[i];
    if (inStr) {
      if (c === '\\' && strChar !== '`') { i += 2; continue; }
      if (c === strChar) inStr = false;
    } else {
      if (c === '"' || c === "'" || c === '`') { inStr = true; strChar = c; }
      else if (c === '(') depth++;
      else if (c === ')') {
        depth--;
        if (depth === 0) {
          let end = i + 1;
          if (content[end] === ';') end++;
          return { varName, block: content.slice(start, end), start, end };
        }
      }
    }
    i++;
  }
  return null;
}

function findModuleLevelVar(content, ident) {
  // Match: const SCREEN_HEIGHT = ... or const { height: SCREEN_HEIGHT } = ...
  const re = new RegExp(
    `(?:^|\\n)(const\\s+(?:\\{[^}]*\\b${ident}\\b[^}]*\\}|${ident})\\s*=\\s*[^\\n]+)`,
    ''
  );
  const m = re.exec(content);
  if (!m) return null;
  return m[1].trimEnd().replace(/;?$/, ';');
}

function getNeededImports(block, original) {
  const rnItems = ['StyleSheet'];
  if (/\bDimensions\b/.test(block)) rnItems.push('Dimensions');
  if (/\bPlatform\b/.test(block)) rnItems.push('Platform');

  // All UPPER_CASE identifiers in styles
  const allCaps = new Set([...block.matchAll(/\b([A-Z][A-Z0-9_]+)\b/g)].map(m => m[1]));
  for (const skip of ['StyleSheet', 'Platform', 'Dimensions', 'OS']) allCaps.delete(skip);

  // Which come from @/constants/colors?
  const colorsMatch = /import\s*\{([^}]+)\}\s*from\s*["']@\/constants\/colors["']/.exec(original);
  const colorImports = new Set();
  if (colorsMatch) {
    const available = new Set(colorsMatch[1].split(',').map(s => s.trim()).filter(Boolean));
    for (const c of allCaps) if (available.has(c)) colorImports.add(c);
  }

  // Remaining caps — check if they're module-level vars
  const moduleVars = {};
  for (const ident of allCaps) {
    if (colorImports.has(ident)) continue;
    const decl = findModuleLevelVar(original, ident);
    if (decl) moduleVars[ident] = decl;
  }

  return { rnItems, colorImports: [...colorImports].sort(), moduleVars };
}

function buildStylesFile(block, rnItems, colorImports, moduleVars) {
  const lines = [];
  lines.push(`import { ${rnItems.join(', ')} } from "react-native";`);
  if (colorImports.length)
    lines.push(`import { ${colorImports.join(', ')} } from "@/constants/colors";`);
  if (Object.keys(moduleVars).length) {
    lines.push('');
    for (const decl of Object.values(moduleVars)) lines.push(decl);
  }
  lines.push('');

  // Replace "const <varName> = " with "export default "
  const exportBlock = block.replace(/^const\s+\w+\s*=\s*/, 'export default ').replace(/;$/, '');
  lines.push(exportBlock + ';');
  lines.push('');

  return lines.join('\n');
}

function updateOriginal(content, varName, start, end, importPath) {
  // Remove styles block
  const before = content.slice(0, start).trimEnd();
  const after = content.slice(end).replace(/^\n+/, '');
  let out = before + '\n' + after;

  // Remove StyleSheet from react-native import if no longer needed elsewhere
  const rnImportRe = /import\s*\{([^}]+)\}\s*from\s*["']react-native["'];?\n?/;
  const stripped = out.replace(rnImportRe, '');
  if (!stripped.includes('StyleSheet')) {
    out = out.replace(rnImportRe, (_, group) => {
      const parts = group.split(',').map(s => s.trim()).filter(s => s && s !== 'StyleSheet');
      if (!parts.length) return '';
      return `import { ${parts.join(', ')} } from "react-native";\n`;
    });
    // Collapse triple+ blank lines
    out = out.replace(/\n{3,}/g, '\n\n');
  }

  // Add styles import after the last import line
  const importLines = [...out.matchAll(/^import\s.+/gm)];
  if (importLines.length) {
    const last = importLines[importLines.length - 1];
    const pos = last.index + last[0].length;
    out = out.slice(0, pos) + `\nimport ${varName} from "${importPath}";` + out.slice(pos);
  } else {
    out = `import ${varName} from "${importPath}";\n` + out;
  }

  return out;
}

const files = process.argv.slice(2);
for (const filepath of files) {
  try {
    const content = readFileSync(filepath, 'utf8');
    const found = findStylesBlock(content);
    if (!found) { console.log(`${filepath}: SKIP — no StyleSheet.create found`); continue; }

    const { varName, block, start, end } = found;
    const { rnItems, colorImports, moduleVars } = getNeededImports(block, content);

    const base = filepath.replace(/\.[^.]+$/, '');
    const stylesPath = base + '.styles.ts';
    const importPath = './' + basename(base) + '.styles';

    writeFileSync(stylesPath, buildStylesFile(block, rnItems, colorImports, moduleVars));
    writeFileSync(filepath, updateOriginal(content, varName, start, end, importPath));

    const extras = [];
    if (Object.keys(moduleVars).length) extras.push(`module_vars=[${Object.keys(moduleVars).join(',')}]`);
    if (varName !== 'styles') extras.push(`var=${varName}`);
    console.log(`${filepath}: OK → ${stylesPath}${extras.length ? ' [' + extras.join(', ') + ']' : ''}`);
  } catch (e) {
    console.error(`${filepath}: ERROR — ${e.message}`);
    console.error(e.stack);
  }
}
