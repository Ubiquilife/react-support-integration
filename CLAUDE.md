# CLAUDE.md — react-support-integration

Drop-in React/Next.js support widget. Equivalent of
`laravel-support-integration`, `nuxt-support-integration`, and
`ios-support-integration` — for any React app not built on Ubiquilife.

## Layout

- `package.json` — `@ubiquilife/react-support-integration`, peerDeps on react 18+
- `src/client.ts` — `SupportClient` (categories/priorities/createTicket)
- `src/SupportWidget.tsx` — `<SupportWidget config={...} />` renders
  the floating FAB + modal form. Inline styles only — zero CSS deps,
  works in any host app theme.
- `src/index.ts` — public exports
- `tsconfig.json` — strict, jsx react-jsx, declarations on

## Build

`tsup` produces both ESM and CJS plus `.d.ts`. Run `npm run build`.

## Mandatory rules

- Public package — keep API stable, breaking changes need a major bump.
- Strings must remain overridable via `strings` prop (no hardcoded UI
  text inside JSX expressions; use `t.*` from the merged strings).
- No CSS files or external CSS deps — only inline `style` props.
  Hosts may have any CSS framework; we don't fight them.
- Match the API shape used by the other support-integration repos
  (snake_case wire, camelCase types).
