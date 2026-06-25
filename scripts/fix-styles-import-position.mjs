#!/usr/bin/env node
/**
 * Fix incorrectly-placed "import X from './X.styles'" lines.
 * The original extraction script placed the import after the first line of a
 * multi-line import block instead of after the last.
 * This script finds the styles import, removes it, then re-inserts it after
 * the true last import (last line matching /from ["'].*["'];?\s*$/).
 */

import { readFileSync, writeFileSync } from 'fs';

const STYLES_IMPORT_RE = /^import \w+ from "\.\/[^"]+\.styles";\n?/m;

function trueLastImportEnd(content) {
  // Find every line that ends an import statement:
  //   "} from 'x';"  or  "import x from 'y';"
  // We want the character offset right after the last such line.
  const lineRe = /^(?:.*\} from ["'][^"']+["'];?|import .+ from ["'][^"']+["'];?)\s*$/gm;
  let last = null;
  let m;
  while ((m = lineRe.exec(content)) !== null) last = m;
  if (!last) return -1;
  return last.index + last[0].length;
}

const files = process.argv.slice(2);
for (const filepath of files) {
  try {
    const content = readFileSync(filepath, 'utf8');

    // Find the styles import line
    const importMatch = STYLES_IMPORT_RE.exec(content);
    if (!importMatch) { console.log(`${filepath}: SKIP — no styles import found`); continue; }

    const stylesImportLine = importMatch[0].trimEnd(); // "import styles from './foo.styles';"

    // Remove it from its current position
    const without = content.replace(STYLES_IMPORT_RE, '');

    // Find the true last import end in the cleaned content
    const insertPos = trueLastImportEnd(without);
    if (insertPos === -1) { console.log(`${filepath}: SKIP — could not find last import`); continue; }

    // Re-insert after the true last import
    const fixed = without.slice(0, insertPos) + '\n' + stylesImportLine + '\n' + without.slice(insertPos);

    // Collapse triple+ blank lines that may have appeared
    const clean = fixed.replace(/\n{3,}/g, '\n\n');

    writeFileSync(filepath, clean);
    console.log(`${filepath}: OK`);
  } catch (e) {
    console.error(`${filepath}: ERROR — ${e.message}`);
  }
}
