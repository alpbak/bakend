# SDK Publishing

How to publish `@bakend/client` (npm) and `bakend` (pub.dev).

## Prerequisites

- Package versions in `sdk/javascript/package.json` and `sdk/dart/pubspec.yaml` match the Bakend release tag.
- GitHub repository secrets configured for CI:
  - `NPM_TOKEN` — npm granular **automation** token with publish access to `@bakend`
  - `PUB_CREDENTIALS` — full contents of `pub-credentials.json` (for manual workflow dispatch)

## npm (`@bakend/client`)

### Scope setup

```bash
npm whoami
npm org ls bakend
```

If the `@bakend` org does not exist, create it at [npmjs.com/org/create](https://www.npmjs.com/org/create).

### CI token (avoid EOTP)

If CI fails with `EOTP`, your token requires a one-time password. npm accounts with 2FA need a token that bypasses it:

1. npm → **Access Tokens** → **Generate New Token** → **Granular Access Token**
2. Permissions: **Read and Write** on `@bakend` packages
3. Enable **Bypass two-factor authentication for automation**
4. Save as GitHub secret `NPM_TOKEN`

Do not use `npm login` credentials or publish tokens without the bypass option in CI.

### Manual publish

```bash
cd sdk/javascript
bun run build
npm publish --access public
```

From repo root: `sh scripts/publish-sdks.sh`

### CI

Workflow: `.github/workflows/sdk-publish.yml` — runs on GitHub Release publish or manual dispatch. Skips npm publish if the version already exists.

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

### CI — option A: GitHub Actions OIDC (recommended)

No long-lived secret. Configure once on pub.dev:

1. Open [pub.dev/packages/bakend/admin](https://pub.dev/packages/bakend/admin)
2. **Automated publishing** → Enable publishing from GitHub Actions
3. Repository: `alpbak/bakend`
4. Tag pattern: `sdk-dart-v{{version}}`

Publish by pushing a tag:

```bash
git tag sdk-dart-v1.0.2
git push origin sdk-dart-v1.0.2
```

The workflow authenticates via OIDC (`id-token: write`).

### CI — option B: `PUB_CREDENTIALS` secret (workflow dispatch)

For **Run workflow** from the Actions tab, set `PUB_CREDENTIALS` to the **entire JSON file**, not a token string:

```bash
dart pub token add https://pub.dev
cat "$HOME/.config/dart/pub-credentials.json"
```

Copy the full output into GitHub → Settings → Secrets → `PUB_CREDENTIALS`.

On macOS the file may be at:

```bash
cat "$HOME/Library/Application Support/dart/pub-credentials.json"
```

If the secret is empty or invalid JSON, the workflow fails with a clear error.

## Verify installs

```bash
npm install @bakend/client@1.0.1
dart pub add bakend
```
