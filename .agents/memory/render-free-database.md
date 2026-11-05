---
name: Render free database
description: The user's explicit choice of a temporary free Render Postgres database for this project.
---

This project uses a free Render Postgres database that expires on 2026-12-05 and is deleted after its 14-day grace period unless upgraded. The user explicitly chose this plan after the expiry and deletion limit was explained.

**Why:** Upgrading can introduce a charge, while allowing expiration can destroy app data; both need the user's direction.

**How to apply:** Confirm with the user before changing the database plan or provider. If the project has data to keep, surface export or upgrade planning before 2026-12-05.
