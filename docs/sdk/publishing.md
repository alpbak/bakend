# SDK Publishing

How to publish `@bakend/client` (npm) and `bakend` (pub.dev).

## Prerequisites

- Package versions in `sdk/javascript/package.json` and `sdk/dart/pubspec.yaml` match the Bakend release tag.
- GitHub repository secrets configured for CI:
  - `NPM_TOKEN` — npm granular token with publish access to `@bakend`
  - `PUB_CREDENTIALS` — pub.dev CI token JSON

## npm (`@bakend/client`)

### Scope setup

```bash
npm whoami
npm org ls bakend
```

If the `@bakend` org does not exist, create it at [npmjs.com/org/create](https://www.npmjs.com/org/create).

### Manual publish

Requires an npm **automation token** (recommended for CI) or interactive 2FA:

1. Create token: npm → Access Tokens → Granular → Publish for `@bakend` packages.
2. Add as GitHub secret `NPM_TOKEN`, or export locally: `export NPM_TOKEN=...`

```bash
cd sdk/javascript
bun run build
npm publish --access public
```

If you see `EOTP`, your account uses 2FA — use a granular automation token instead of `npm login`, or complete the browser OTP prompt.

From repo root: `sh scripts/publish-sdks.sh`

### CI

Workflow: `.github/workflows/sdk-publish.yml` — runs on GitHub Release publish or manual dispatch.

## pub.dev (`bakend`)

### Publisher verification

1. Sign in at [pub.dev](https://pub.dev).
2. Verify publisher for `github.com/alpbak/bakend`.

### Manual publish

Opens a browser for Google OAuth on first publish:

```bash
cd sdk/dart
dart pub publish --dry-run
dart pub publish
```

Complete the browser authorization when prompted.

### CI token

```bash
dart pub token add https://pub.dev
```

Store the resulting credentials JSON as the `PUB_CREDENTIALS` GitHub secret.

## Verify installs

```bash
npm install @bakend/client@1.0.1
dart pub add bakend
```
