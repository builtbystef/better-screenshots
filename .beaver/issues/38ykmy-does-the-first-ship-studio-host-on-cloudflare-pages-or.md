---
id: 38ykmy
title: Does the first-ship Studio host on Cloudflare Pages or Workers, and at what URL?
state: done
assignee: agent
priority: medium
labels:
    - roadmap:pfdjl3
    - session:grill
depends_on:
    - 3q46jo
parent: pfdjl3
created: 2026-08-19T09:18:01Z
updated: 2026-08-19T10:10:37Z
---

Grill session. The host family is Cloudflare. 3q46jo settled the artifact: serve `apps/web/dist/client` (`_shell.html` + assets) and rewrite unknown URLs to `/_shell.html`. There is no `index.html`.

Settle with the user:

- Pages or Workers (or Workers serving static assets).
- The public URL: `*.pages.dev` / `*.workers.dev`, or a custom domain. `betterscreenshots.co` as a marketing site still waits; this is only whether the Studio binds that name now.

Do not deploy in this session. Do not design the marketing page.

Pointers: 3q46jo note (SPA rewrite, no `index.html`); `docs/ARCHITECTURE.md`.

## Notes

**agent** — 2026-08-19T10:10:37Z

# Question

Does the first-ship Studio host on Cloudflare Pages or Workers, and at what URL?

# Answer

Cloudflare Pages. `https://betterscreenshots.co` is the Studio. `www` 301s to the apex. Project `better-screenshots` → `better-screenshots.pages.dev`, left public.

# Cut

**Host.** Cloudflare Pages. No Functions. No Worker script. Serve `apps/web/dist/client`. Deploy copies `_shell.html` to `index.html` so `/` and Pages' SPA fallback (no `404.html` → rewrite to `/`) have a root document. Workers and Workers static assets are out.

**Public URL.** `https://betterscreenshots.co` is the Studio. Empty Studio on first open. `https://www.betterscreenshots.co` 301s to the apex — not a second Studio. `_redirects` cannot do domain-level redirects; the 301 is a zone Redirect Rule (or equivalent) once both names are on the zone.

**Platform hostname.** Pages project slug `better-screenshots` → `better-screenshots.pages.dev`. Stays public. Not the public name. No redirect to the apex.

**Apex and marketing.** A later marketing page does not keep the apex unless the Studio moves. First ship is the Studio alone.

**Not this session.** No deploy. The name is NXDOMAIN today; registration and a Cloudflare zone wait with deploy. Apex custom domain needs the zone on Cloudflare.

# Reason

First ship is a static SPA. Pages is the host for that; Workers without a script is the same job with a different CLI. Both products treat `/` and SPA fallback as `index.html`, so the copy is the adaptation (same as job-complete). The sitting should open at the product name, not a platform hostname. `www` as a second origin is a duplicate Studio. `pages.dev` stays so the Studio is reachable before the NXDOMAIN is registered, and needs no extra redirect after. Spending the apex on the Studio is the cost of landing that name now.

# Not this node

Deploy. Marketing page. Security headers. Git vs `wrangler pages deploy`. Preview URLs.
