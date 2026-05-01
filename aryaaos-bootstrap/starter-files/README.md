# Starter files

Pre-built files Claude Code should drop into the new `aryaaos` repo on Day 1 / Day 2.

| File | Destination |
|---|---|
| `package.json` | repo root |
| `tailwind.config.ts` | repo root |
| `globals.css` | `src/app/globals.css` |
| `../02-convex-schema.ts` | `convex/schema.ts` |

## Usage

In Claude Code, after `git clone` of the empty aryaaos repo:

```bash
# Copy starter files
cp ../Abc/aryaaos-bootstrap/starter-files/package.json .
cp ../Abc/aryaaos-bootstrap/starter-files/tailwind.config.ts .
mkdir -p src/app
cp ../Abc/aryaaos-bootstrap/starter-files/globals.css src/app/globals.css

mkdir -p convex
cp ../Abc/aryaaos-bootstrap/02-convex-schema.ts convex/schema.ts

bun install
```

Then continue with Day 2 of `05-execution-plan.md`.

## Notes

- Tokens are placeholders. Final hex values locked Day 10 when I produce the design tokens artifact.
- Playfair Display + Inter loaded via `next/font` (Claude Code wires up in `app/layout.tsx`).
- Dark mode toggles via `class="dark"` on root.
- shadcn/ui components install separately via `bunx shadcn@latest add [component]` — the dependencies are pre-listed in `package.json`.
