# React Support Integration

Drop-in React/Next.js support widget. Floating help button + ticket
form, posts to a Ubiquilife Support backend.

> **For React apps not built on Ubiquilife.** Equivalent to
> `laravel-support-integration`, `nuxt-support-integration`, and
> `ios-support-integration`.

## Install

```bash
npm install @ubiquilife/react-support-integration
```

## Use

```tsx
import { SupportWidget } from '@ubiquilife/react-support-integration';

export default function App() {
  return (
    <>
      <YourApp />
      <SupportWidget
        config={{
          apiBaseUrl: 'https://support.ubiqui.life/external-api',
          apiKey: process.env.NEXT_PUBLIC_SUPPORT_KEY!,
          appName: 'Acme Web',
        }}
      />
    </>
  );
}
```

## Headless

```tsx
import { SupportClient } from '@ubiquilife/react-support-integration';

const client = new SupportClient({
  apiBaseUrl: 'https://support.ubiqui.life/external-api',
  apiKey: process.env.SUPPORT_KEY!,
  appName: 'Acme Web',
});

await client.createTicket({
  title: 'Crash on save',
  description: 'Tapping save throws.',
});
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `config` | `SupportConfig` | Required — `apiBaseUrl`, `apiKey`, `appName` (+ optional `defaultReporterName`, `identimeUserId`) |
| `position` | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | Defaults to bottom-right |
| `accentColor` | `string` | CSS colour for the FAB |
| `strings` | `Partial<typeof defaultStrings>` | Override label text per-locale |

## License

MIT.
