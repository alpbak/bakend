# Dart SDK

> Status: Implemented (Milestone 11) · Published on pub.dev (Milestone 14)

**Package:** `bakend`

## Install

```bash
dart pub add bakend
```

Workspace development (Bakend monorepo):

```yaml
dependencies:
  bakend:
    path: ../sdk/dart
```

## Quick start

```dart
import 'package:bakend/bakend.dart';

final client = BakendClient(baseUrl: 'http://localhost:8080');

await client.auth.register(
  email: 'you@example.com',
  password: 'password123',
);

final posts = client.collection('posts');
final record = await posts.create({'title': 'Hello'});
```

## See also

- [SDK user guide](../user-guide/sdk.md)
- [RFC-0009 SDK Design](../rfcs/RFC-0009-SDK-Design.md)
