# Bakend Dart SDK

Client library for Dart and Flutter applications.

**Milestone:** 11 — SDKs

## Usage

```dart
import 'package:bakend/bakend.dart';

final client = BakendClient('http://localhost:8080');

await client.auth.register(
  const AuthCredentials(email: 'user@example.com', password: 'password123'),
);

final posts = client.collection('posts');
final post = await posts.create({'title': 'Hello'});
```

See [docs/sdk/dart.md](../../docs/sdk/dart.md) for full API reference.

## Tests

Requires Bun (to start the test server):

```bash
cd sdk/dart
dart pub get
dart test
```
