# SDK

Use Bakend client libraries from JavaScript, TypeScript, or Dart applications.

> **Beta:** Install SDKs from the Bakend monorepo. Registry publishing (npm, pub.dev) is planned for a future release.

## JavaScript / TypeScript

Package: `@bakend/client`

### Install from monorepo

Clone Bakend and install workspace dependencies:

```bash
git clone https://github.com/alpbak/bakend.git
cd bakend
bun install
```

In a project inside the monorepo (or with workspace reference):

```ts
import { BakendClient } from "@bakend/client";

const client = new BakendClient("http://localhost:8080");
```

### Example

Run the SDK demo:

```bash
cd examples/sdk-demo
bun run ../../src/index.ts start
# In another terminal:
bun run demo.ts
```

See [JavaScript SDK reference](../sdk/javascript.md) for full API.

## Dart / Flutter

Package: `bakend`

### Install from monorepo

Add a path dependency in your `pubspec.yaml`:

```yaml
dependencies:
  bakend:
    path: ../bakend/sdk/dart
```

```bash
dart pub get
```

```dart
import 'package:bakend/bakend.dart';

final client = BakendClient('http://localhost:8080');
```

See [Dart SDK reference](../sdk/dart.md) for full API.

## Capabilities

Both SDKs support:

- Authentication (register, login, refresh, logout)
- Collection CRUD
- File storage upload/download
- Realtime WebSocket subscriptions

## Related

- [SDK index](../sdk/README.md)
- [examples/sdk-demo/](../../examples/sdk-demo/)
