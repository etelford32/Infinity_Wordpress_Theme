#!/usr/bin/env python3
"""
One-shot GA4 setup for the projects funnel (theme 3.15.0+).

Creates, in the GA4 property that elliottelford.com reports into:

  Key events          wishlist_click, project_click, sign_up
  Custom dimensions   project, placement, cta, page_context, intent,
                      source (all event-scoped)

Safe to re-run: anything already there is skipped. Uses only the
standard library and Google's Analytics Admin API.

One-time auth (needs the Google Cloud SDK, `gcloud`):

    gcloud auth application-default login \
        --scopes=https://www.googleapis.com/auth/analytics.edit,https://www.googleapis.com/auth/cloud-platform

If the API answers "API not enabled" or asks for a quota project:

    gcloud services enable analyticsadmin.googleapis.com --project=YOUR_GCP_PROJECT
    gcloud auth application-default set-quota-project YOUR_GCP_PROJECT

Then:

    python3 tools/ga4-setup.py --dry-run     # show what would change
    python3 tools/ga4-setup.py               # apply

The property is found automatically by the web stream whose URL
contains --site (default elliottelford.com); pass --property 123456789
to pick one explicitly.
"""

import argparse
import json
import subprocess
import sys
import urllib.error
import urllib.request

API = "https://analyticsadmin.googleapis.com/v1beta"

KEY_EVENTS = ["wishlist_click", "project_click", "sign_up"]

# link_url / link_text are left out on purpose: GA4's built-in
# "Link URL" and "Link text" dimensions already read those parameters.
DIMENSIONS = [
    ("project", "Project", "Which project a funnel event is about (etu, parkers, landscaping)"),
    ("placement", "Placement", "Where on the site the link sits (projects_hero, projects_etu, homepage_band...)"),
    ("cta", "CTA", "Which button: primary, secondary, wishlist, intent, feature, link"),
    ("page_context", "Page context", "Page type the event fired on: home, projects, article, page, archive"),
    ("intent", "Intent", "Projects-page intent tile used"),
    ("source", "Signup source", "Which subscribe form a sign_up came from"),
]


def token():
    try:
        return subprocess.check_output(
            ["gcloud", "auth", "application-default", "print-access-token"],
            text=True, stderr=subprocess.PIPE,
        ).strip()
    except FileNotFoundError:
        sys.exit("gcloud not found. Install the Google Cloud SDK first (see the top of this file).")
    except subprocess.CalledProcessError as e:
        sys.exit("Could not get a token. Run the `gcloud auth application-default login` "
                 "command from the top of this file.\n" + e.stderr)


def call(method, path, tok, body=None):
    req = urllib.request.Request(
        API + path,
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {path} failed ({e.code}):\n{e.read().decode()}")


def list_all(path, key, tok):
    out, page = [], ""
    while True:
        sep = "&" if "?" in path else "?"
        data = call("GET", f"{path}{sep}pageSize=200" + (f"&pageToken={page}" if page else ""), tok)
        out += data.get(key, [])
        page = data.get("nextPageToken", "")
        if not page:
            return out


def find_property(site, tok):
    matches = []
    for acct in list_all("/accountSummaries", "accountSummaries", tok):
        for prop in acct.get("propertySummaries", []):
            pid = prop["property"]  # "properties/123"
            for s in list_all(f"/{pid}/dataStreams", "dataStreams", tok):
                uri = s.get("webStreamData", {}).get("defaultUri", "")
                if site in uri:
                    matches.append((pid, prop.get("displayName", ""), uri))
    if not matches:
        sys.exit(f"No GA4 web stream found containing '{site}'. Pass --property <id>.")
    if len(matches) > 1:
        lines = "\n".join(f"  {p}  {n}  {u}" for p, n, u in matches)
        sys.exit(f"Several properties match '{site}'; pick one with --property:\n{lines}")
    pid, name, uri = matches[0]
    print(f"Property: {pid} ({name}, stream {uri})")
    return pid


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--property", help="GA4 property id (digits), skips auto-discovery")
    ap.add_argument("--site", default="elliottelford.com")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    tok = token()
    pid = f"properties/{args.property}" if args.property else find_property(args.site, tok)

    have_keys = {k["eventName"] for k in list_all(f"/{pid}/keyEvents", "keyEvents", tok)}
    for name in KEY_EVENTS:
        if name in have_keys:
            print(f"  key event   {name:<16} already set")
            continue
        print(f"  key event   {name:<16} {'would create' if args.dry_run else 'creating'}")
        if not args.dry_run:
            call("POST", f"/{pid}/keyEvents", tok, {"eventName": name, "countingMethod": "ONCE_PER_EVENT"})

    have_dims = {d["parameterName"] for d in list_all(f"/{pid}/customDimensions", "customDimensions", tok)}
    for param, display, desc in DIMENSIONS:
        if param in have_dims:
            print(f"  dimension   {param:<16} already set")
            continue
        print(f"  dimension   {param:<16} {'would create' if args.dry_run else 'creating'}")
        if not args.dry_run:
            call("POST", f"/{pid}/customDimensions", tok, {
                "parameterName": param, "displayName": display,
                "description": desc, "scope": "EVENT",
            })

    print("\nDone." if not args.dry_run else "\nDry run only; nothing changed.")
    print("Dimensions only fill in for events collected from now on (allow ~24-48h).")


if __name__ == "__main__":
    main()
