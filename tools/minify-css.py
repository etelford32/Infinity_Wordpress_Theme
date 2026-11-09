#!/usr/bin/env python3
"""Write foo.min.css next to every theme stylesheet.

Run by the deploy workflow before rsync. functions.php (infinity_css_url)
serves the .min file when it exists and the readable source when it
doesn't, so a checkout without this step still works.

Deliberately conservative, with no dependencies:
  - comments go (strings are left untouched, quotes and all)
  - runs of whitespace collapse to one space
  - whitespace next to { } ; , and > is dropped, and before !important
  - the last ; in a block is dropped
Nothing else is rewritten: no value shortening, no rule merging, no
reordering, so the cascade is byte-for-byte the same rules in the same
order. Spaces around + - * / are kept because calc() needs them, and
the space before a : is kept because "a :hover" and "a:hover" differ.

The style.css header comment (Theme Name, Version, ...) is read by
WordPress from style.css, never from style.min.css, so dropping it from
the minified copy is fine.

Usage: tools/minify-css.py [--check]
  --check  minify to memory only and fail if any file looks broken
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def minify(css):
    out = []
    i, n = 0, len(css)
    while i < n:
        c = css[i]
        if c in '"\'':  # copy strings verbatim
            j = i + 1
            while j < n and css[j] != c:
                j += 2 if css[j] == '\\' else 1
            out.append(css[i:j + 1])
            i = j + 1
            continue
        if css.startswith('/*', i):  # drop comments
            j = css.find('*/', i + 2)
            if j < 0:
                raise ValueError('unterminated comment at offset %d' % i)
            i = j + 2
            out.append(' ')
            continue
        out.append(c)
        i += 1
    s = ''.join(out)

    # Work on the parts outside strings only
    parts = re.split(r'("(?:[^"\\]|\\.)*"|\'(?:[^\'\\]|\\.)*\')', s)
    for k in range(0, len(parts), 2):
        p = re.sub(r'\s+', ' ', parts[k])
        p = re.sub(r'\s*([{};,>])\s*', r'\1', p)
        p = re.sub(r'\s*!important', '!important', p)
        p = re.sub(r';}', '}', p)
        parts[k] = p
    return ''.join(parts).strip() + '\n'


def balanced(css):
    stripped = re.sub(r'"(?:[^"\\]|\\.)*"|\'(?:[^\'\\]|\\.)*\'', '', css)
    return stripped.count('{') == stripped.count('}')


def main():
    check = '--check' in sys.argv
    files = [os.path.join(ROOT, 'style.css')] + sorted(glob.glob(os.path.join(ROOT, 'assets/css/*.css')))
    ok = True
    for src in files:
        if src.endswith('.min.css'):
            continue
        with open(src, encoding='utf-8') as fh:
            css = fh.read()
        mini = minify(css)
        if not balanced(mini):
            print('::error file=%s::braces unbalanced after minifying' % os.path.relpath(src, ROOT))
            ok = False
            continue
        if not check:
            with open(src[:-4] + '.min.css', 'w', encoding='utf-8') as fh:
                fh.write(mini)
        print('%-32s %7d -> %7d bytes' % (os.path.relpath(src, ROOT), len(css.encode()), len(mini.encode())))
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
