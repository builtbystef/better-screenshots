---
id: jdwqao
title: Register betterscreenshots.co and put the zone on Cloudflare?
state: todo
priority: medium
labels:
    - roadmap:pfdjl3
    - session:task
depends_on:
    - 38ykmy
parent: pfdjl3
created: 2026-08-19T10:11:00Z
updated: 2026-08-19T11:34:22Z
---

Task session. 38ykmy bound the Studio to `https://betterscreenshots.co` (`www` 301 to the apex). Public DNS is NXDOMAIN. Apex custom domain on Pages needs the zone on Cloudflare.

Do the work. The user must register and point nameservers; give a precise checklist where you cannot.

Checklist:

- Register `betterscreenshots.co`.
- Add the zone on Cloudflare (same account that will own Pages project `better-screenshots`).
- Point the registrar nameservers at that zone.
- Confirm public DNS answers NS for the Cloudflare nameservers.

Do not create the Pages project. Do not deploy. Do not attach the custom domain. Do not design the marketing page.

At closure, the note records: registrar, Cloudflare account/zone, nameserver hostnames, and that public NS is live.

Pointers: 38ykmy note; `docs/GLOSSARY.md` (Studio).

## Notes

**agent** — 2026-08-19T11:34:07Z

# Status

Parked. User will register later. Domain is still unregistered. Do not close until public NS is live.

# Already checked (2026-08-19)

- `betterscreenshots.co` is NXDOMAIN. IANA RDAP and `rdap.registry.co` both 404 (not registered).
- This environment has no Wrangler, no Cloudflare token, no Pages project. Correct: this node does not create the Pages project, deploy, or attach the domain.

# Recommended path

Cloudflare Registrar on the account that will own Pages project `better-screenshots`. Registration creates the zone and already points NS at Cloudflare.

1. Log into that Cloudflare account (email verified).
2. [Register domains](https://dash.cloudflare.com/?to=/:account/registrar/register) → search `betterscreenshots.co` → Purchase (1 year is enough).
3. If the name is missing from results, it is not available there — stop.
4. After the domain management page opens: copy account name/id, the two assigned nameserver hostnames, zone status (Active).
5. Do not create the Pages project, add A/CNAME, attach a custom domain, or add a `www` 301.

# Alternate path

Register elsewhere, then Domains → Onboard a domain → `betterscreenshots.co` → Free plan on that same Cloudflare account. Replace registrar NS with the two Cloudflare assigns. Do not flip NS before the zone exists. Leave the zone empty.

# Closure needs

Registrar, Cloudflare account/zone, nameserver hostnames, and a public `NS` answer for those hostnames. Then close.
