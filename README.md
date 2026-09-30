Gokly oil and gas website

## Course creation autofill (dev only)

The course wizard (`/training/course-creation`) has six steps and ~40 fields. To avoid
refilling it by hand while testing the submission flow, a valid sample course can be
dropped in three ways:

- the dashed **Fill demo data** button in the page header (dev builds only),
- `?autofill=run` on the URL, which opens the form already filled,
- `__goklyFillCourse()` from the DevTools console.

Each fill rotates the title and issues a unique `DEMO-<code>`, so courses can be
created back to back without clashing, and it fabricates a PNG thumbnail so the
upload phase runs like a human run. The values live in
`src/lib/course-autofill.ts` and are unit-tested against the real per-step schemas
(`src/test/course-autofill.test.ts`) — if a step's rules change, the sample has to
change with them or the test fails.

Bulk seeding without the UI: `npm run seed:course` in `backend/`.

# gokly-oil-gas-new
# gokly-oil-gas-new
