#!/usr/bin/env python3
"""
Extract StyleSheet.create blocks into separate .styles.ts files.
Usage: python3 scripts/extract-styles.py <file1> <file2> ...
"""

import re
import sys
import os


def find_styles_block(content):
    """Find StyleSheet.create block. Returns (var_name, block_text, start, end) or (None,...,-1,-1)."""
    pattern = re.compile(r'(const\s+(\w+)\s*=\s*StyleSheet\.create\()')
    match = pattern.search(content)
    if not match:
        return None, None, -1, -1

    var_name = match.group(2)
    start = match.start()
    i = match.end()  # right after the opening '('

    depth = 1  # we're inside the opening paren
    in_str = False
    str_char = None

    while i < len(content):
        c = content[i]

        if in_str:
            if c == '\\' and str_char != '`':
                i += 2
                continue
            if c == str_char:
                in_str = False
        else:
            if c in ('"', "'", '`'):
                in_str = True
                str_char = c
            elif c == '(':
                depth += 1
            elif c == ')':
                depth -= 1
                if depth == 0:
                    end = i + 1
                    if end < len(content) and content[end] == ';':
                        end += 1
                    return var_name, content[start:end], start, end
        i += 1

    return None, None, -1, -1


def find_module_level_vars(content, identifiers):
    """
    Find module-level const declarations for given identifiers (non-color, non-RN).
    Returns dict of {name: full_declaration_line}.
    """
    result = {}
    for ident in identifiers:
        # Match: const SCREEN_HEIGHT = ... or const { height: SCREEN_HEIGHT } = ...
        m = re.search(
            rf'(?m)^const\s+(?:\{{[^}}]*\b{re.escape(ident)}\b[^}}]*\}}\s*=\s*.+|{re.escape(ident)}\s*=\s*.+)',
            content
        )
        if m:
            result[ident] = m.group(0).rstrip(';') + ';'
    return result


def get_needed_imports(styles_block, original_content):
    """Determine what the styles file needs to import."""
    rn_items = ['StyleSheet']
    if re.search(r'\bDimensions\b', styles_block):
        rn_items.append('Dimensions')
    if re.search(r'\bPlatform\b', styles_block):
        rn_items.append('Platform')

    # Find all UPPER_CASE identifiers used in styles
    all_caps = set(re.findall(r'\b([A-Z][A-Z0-9_]+)\b', styles_block))
    all_caps -= {'StyleSheet', 'Platform', 'Dimensions', 'OS'}

    # Which of those come from @/constants/colors?
    colors_match = re.search(
        r'import\s*\{([^}]+)\}\s*from\s*["\']@/constants/colors["\']',
        original_content
    )
    color_imports = set()
    if colors_match:
        available = {c.strip() for c in colors_match.group(1).split(',') if c.strip()}
        color_imports = all_caps & available

    # Which are module-level vars (SCREEN_WIDTH, SCREEN_HEIGHT, etc.)?
    other_caps = all_caps - color_imports
    module_vars = find_module_level_vars(original_content, other_caps)

    return rn_items, sorted(color_imports), module_vars


def build_styles_file(var_name, styles_block, rn_items, color_imports, module_vars):
    lines = []
    lines.append(f'import {{ {", ".join(rn_items)} }} from "react-native";')
    if color_imports:
        lines.append(f'import {{ {", ".join(color_imports)} }} from "@/constants/colors";')
    if module_vars:
        lines.append('')
        for decl in module_vars.values():
            lines.append(decl)
    lines.append('')

    # Replace "const <var_name> = " with "export default "
    export_block = re.sub(r'^const\s+\w+\s*=\s*', 'export default ', styles_block)
    # Strip trailing semicolon after the closing ')' — export default doesn't need it
    export_block = export_block.rstrip(';').rstrip()
    lines.append(export_block + ';')
    lines.append('')

    return '\n'.join(lines)


def update_original(content, var_name, start, end, styles_import_path):
    """Remove styles block, clean up StyleSheet import, add styles import."""

    # --- Remove styles block ---
    before = content[:start].rstrip('\n')
    after = content[end:].lstrip('\n')
    new = before + '\n' + after

    # --- Remove StyleSheet from react-native import if no longer needed ---
    # Check if StyleSheet is used anywhere else in the file (outside the block we removed)
    remaining = new
    # Strip the RN import line temporarily to check residual usage
    stripped = re.sub(r'import\s*\{[^}]+\}\s*from\s*["\']react-native["\'];?\n?', '', remaining, count=1)
    if 'StyleSheet' not in stripped:
        def _remove_stylesheet(m):
            parts = [p.strip() for p in m.group(1).split(',')]
            parts = [p for p in parts if p and p != 'StyleSheet']
            if not parts:
                return ''
            return 'import { ' + ', '.join(parts) + ' } from "react-native";'
        new = re.sub(
            r'import\s*\{([^}]+)\}\s*from\s*["\']react-native["\'];?',
            _remove_stylesheet,
            new,
            count=1
        )
        # Clean up blank lines left by a completely removed import
        new = re.sub(r'\n{3,}', '\n\n', new)

    # --- Add styles import after last import statement ---
    last_import = None
    for m in re.finditer(r'^import\s.+', new, re.MULTILINE):
        last_import = m
    if last_import:
        pos = last_import.end()
        new = new[:pos] + f'\nimport {var_name} from "{styles_import_path}";' + new[pos:]
    else:
        new = f'import {var_name} from "{styles_import_path}";\n' + new

    return new


def process(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    var_name, block, start, end = find_styles_block(content)
    if var_name is None:
        return 'SKIP — no StyleSheet.create found'

    rn_items, color_imports, module_vars = get_needed_imports(block, content)

    base = os.path.splitext(filepath)[0]
    styles_path = base + '.styles.ts'
    basename = os.path.basename(base)
    import_path = f'./{basename}.styles'

    styles_src = build_styles_file(var_name, block, rn_items, color_imports, module_vars)
    with open(styles_path, 'w') as f:
        f.write(styles_src)

    updated = update_original(content, var_name, start, end, import_path)
    with open(filepath, 'w') as f:
        f.write(updated)

    extras = []
    if module_vars:
        extras.append(f'module_vars={list(module_vars.keys())}')
    if var_name != 'styles':
        extras.append(f'var={var_name}')
    suffix = f' [{", ".join(extras)}]' if extras else ''
    return f'OK → {styles_path}{suffix}'


if __name__ == '__main__':
    for filepath in sys.argv[1:]:
        try:
            print(f'{filepath}: {process(filepath)}')
        except Exception as e:
            import traceback
            print(f'{filepath}: ERROR — {e}')
            traceback.print_exc()
