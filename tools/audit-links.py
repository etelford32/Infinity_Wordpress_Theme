#!/usr/bin/env python3
"""Sitemap + internal-link audit for elliottelford.com (or any WP site).

1. Downloads /wp-sitemap.xml and every sub-sitemap it references.
2. HEAD-requests every sitemap URL; reports anything whose final status
   is not 200 (and flags sitemap URLs that redirect — they shouldn't).
3. Fetches each 200 HTML page, extracts internal <a href> targets, and
   reports internal links that don't resolve to 200 — with the pages
   they originate from, so template vs. content sources are traceable.

Stdlib only. Usage:

    python3 tools/audit-links.py https://elliottelford.com --out audit-report

Writes <out>/report.txt (human summary), <out>/sitemap-status.tsv and
<out>/broken-links.tsv (machine-readable detail).
"""

import argparse
import concurrent.futures
import html
import html.parser
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

TIMEOUT = 30
UA = "InfinityLinkAudit/1.0 (theme link audit; contact site owner)"

SKIP_SCHEMES = ("mailto:", "tel:", "javascript:", "data:", "#")
LOC_RE = re.compile(r"<loc>\s*([^<\s]+)\s*</loc>")


class LinkParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs = []

    def handle_starttag(self, tag, attrs):
        if tag != "a":
            return
        for name, value in attrs:
            if name == "href" and value:
                self.hrefs.append(html.unescape(value))


def request(url, method="GET", want_body=False):
    """Return (final_status, final_url, body_or_None, content_type)."""
    req = urllib.request.Request(url, method=method, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            body = resp.read() if want_body else None
            ctype = resp.headers.get("Content-Type", "")
            return resp.status, resp.geturl(), body, ctype
    except urllib.error.HTTPError as e:
        return e.code, e.geturl() or url, None, ""
    except Exception as e:
        return 0, url, None, f"error: {e.__class__.__name__}: {e}"


def check_status(url):
    """HEAD with GET fallback; returns (url, final_status, final_url, note)."""
    status, final_url, _, note = request(url, method="HEAD")
    if status in (0, 403, 405, 501):
        status, final_url, _, note = request(url, method="GET")
    redirected = urllib.parse.urldefrag(final_url)[0].rstrip("/") != \
        urllib.parse.urldefrag(url)[0].rstrip("/")
    return url, status, final_url if redirected else "", note if status == 0 else ""


def fetch_page_links(url, host):
    """GET an HTML page, return internal absolute link targets."""
    status, final_url, body, ctype = request(url, want_body=True)
    if status != 200 or body is None or "html" not in ctype.lower():
        return url, status, []
    parser = LinkParser()
    try:
        parser.feed(body.decode("utf-8", errors="replace"))
    except Exception:
        return url, status, []
    links = set()
    for href in parser.hrefs:
        href = href.strip()
        if not href or href.startswith(SKIP_SCHEMES):
            continue
        absolute = urllib.parse.urljoin(final_url or url, href)
        absolute = urllib.parse.urldefrag(absolute)[0]
        parsed = urllib.parse.urlparse(absolute)
        if parsed.scheme not in ("http", "https"):
            continue
        if parsed.hostname and parsed.hostname.lower().removeprefix("www.") != host:
            continue
        links.add(absolute)
    return url, status, sorted(links)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("base_url", nargs="?", default="https://elliottelford.com")
    ap.add_argument("--out", default="audit-report", help="output directory")
    ap.add_argument("--concurrency", type=int, default=8)
    ap.add_argument("--max-pages", type=int, default=0,
                    help="limit pages crawled for links (0 = all)")
    args = ap.parse_args()

    import os
    os.makedirs(args.out, exist_ok=True)
    base = args.base_url.rstrip("/")
    host = urllib.parse.urlparse(base).hostname.lower().removeprefix("www.")

    # 1. Sitemap index -> sub-sitemaps -> URL list
    print(f"Fetching {base}/wp-sitemap.xml ...", flush=True)
    status, _, body, _ = request(f"{base}/wp-sitemap.xml", want_body=True)
    if status != 200 or not body:
        sys.exit(f"FATAL: sitemap index returned {status}")
    index_locs = LOC_RE.findall(body.decode("utf-8", errors="replace"))
    sub_sitemaps = [u for u in index_locs if u.endswith(".xml")]
    page_urls = set(u for u in index_locs if not u.endswith(".xml"))
    print(f"  {len(sub_sitemaps)} sub-sitemaps", flush=True)
    for sm in sub_sitemaps:
        s, _, b, _ = request(sm, want_body=True)
        if s != 200 or not b:
            print(f"  WARN sub-sitemap {sm} -> {s}", flush=True)
            continue
        page_urls.update(LOC_RE.findall(b.decode("utf-8", errors="replace")))
    page_urls = sorted(page_urls)
    print(f"  {len(page_urls)} URLs in sitemap", flush=True)

    pool = concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency)

    # 2. Status-check every sitemap URL
    print("Checking sitemap URL statuses ...", flush=True)
    sitemap_status = {}
    redirecting = {}
    with open(os.path.join(args.out, "sitemap-status.tsv"), "w") as f:
        f.write("status\turl\tredirects_to\n")
        for url, code, redir, note in pool.map(check_status, page_urls):
            sitemap_status[url] = code
            if redir:
                redirecting[url] = redir
            f.write(f"{code}\t{url}\t{redir}\n")

    # 3. Crawl 200 pages for internal links
    ok_pages = [u for u, c in sitemap_status.items() if c == 200]
    if args.max_pages:
        ok_pages = ok_pages[: args.max_pages]
    print(f"Extracting links from {len(ok_pages)} pages ...", flush=True)
    link_sources = {}  # target -> set(sources)
    for src, _, links in pool.map(
        lambda u: fetch_page_links(u, host), ok_pages
    ):
        for target in links:
            link_sources.setdefault(target, set()).add(src)

    new_targets = sorted(t for t in link_sources if t not in sitemap_status)
    print(f"Checking {len(new_targets)} internal link targets not in sitemap ...",
          flush=True)
    target_status = dict(sitemap_status)
    for url, code, _, _ in pool.map(check_status, new_targets):
        target_status[url] = code
    pool.shutdown()

    # 4. Report
    broken = {t: s for t in link_sources
              if (s := target_status.get(t)) is not None and s != 200}
    bad_sitemap = {u: c for u, c in sitemap_status.items() if c != 200}
    report_path = os.path.join(args.out, "report.txt")
    with open(os.path.join(args.out, "broken-links.tsv"), "w") as f:
        f.write("status\ttarget\tsample_sources\n")
        for t in sorted(broken):
            samples = "; ".join(sorted(link_sources[t])[:3])
            f.write(f"{broken[t]}\t{t}\t{samples}\n")
    with open(report_path, "w") as f:
        f.write(f"Link audit of {base}\n")
        f.write(f"Sitemap URLs checked: {len(page_urls)}\n")
        f.write(f"Sitemap URLs not 200: {len(bad_sitemap)}\n")
        for u, c in sorted(bad_sitemap.items()):
            f.write(f"  {c}  {u}\n")
        f.write(f"Sitemap URLs that redirect (should be direct): "
                f"{len(redirecting)}\n")
        for u, r in sorted(redirecting.items()):
            f.write(f"  {u} -> {r}\n")
        f.write(f"Internal link targets checked: {len(link_sources)}\n")
        f.write(f"Broken internal links (non-200): {len(broken)}\n")
        for t in sorted(broken):
            f.write(f"  {broken[t]}  {t}\n")
            for s in sorted(link_sources[t])[:3]:
                f.write(f"      linked from {s}\n")
    print(f"Done. Report: {report_path}", flush=True)
    if bad_sitemap or broken:
        print(f"{len(bad_sitemap)} bad sitemap URLs, "
              f"{len(broken)} broken internal links", flush=True)


if __name__ == "__main__":
    main()
