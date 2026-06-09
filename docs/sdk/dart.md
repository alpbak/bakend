# Dart SDK

> Status: Implemented (Milestone 11)

Flutter and Dart client library.

**Package:** `bakend` (workspace-local; pub.dev publishing in Milestone 13)

## Installation

Add a path dependency in your `pubspec.yaml`:

```yaml
dependencies:
  bakend:
    path: ../Bakend/sdk/dart
```

Then:

```bash
dart pub get
```

## Quick Start

```dart
import 'package:bakend/bakend.dart';

final client = BakendClient('http://localhost:8080');

await client.auth.register(
  const AuthCredentials(email: 'user@example.com', password: 'password123'),
);

final posts = client.collection('posts');
final post = await posts.create({'title': 'Hello', 'content': 'World'});
final all = await posts.list();
print(all);

client.close();
```

## Authentication

```dart
await client.auth.register(const AuthCredentials(email: email, password: password));
await client.auth.login(const AuthCredentials(email: email, password: password));
await client.auth.refresh();
await client.auth.logout();
final user = await client.auth.getMe();

client.auth.token;
client.auth.refreshToken;
```

### Custom auth store

```dart
class MyAuthStore implements AuthStore {
  // implement getToken, setToken, getRefreshToken, setRefreshToken, clear
}

final client = BakendClient('http://localhost:8080', authStore: MyAuthStore());
```

## Collections (CRUD)

```dart
final posts = client.collection('posts');

await posts.list();
await posts.get('rec_...');
await posts.create({'title': 'Hello'});
await posts.update('rec_...', {'title': 'Updated'});
await posts.delete('rec_...');
```

## Storage

```dart
import 'dart:convert';

final metadata = await client.storage.upload(
  utf8.encode('hello'),
  filename: 'hello.txt',
  visibility: 'public',
);

final bytes = await client.storage.download(metadata.id);
final url = client.storage.getDownloadUrl(metadata.id);
await client.storage.delete(metadata.id);
```

## Realtime

```dart
client.realtime.subscribe('posts.*', (event) {
  print('${event.type}: ${event.payload}');
});

client.realtime.unsubscribe('posts.*');
client.realtime.disconnect();
```

## Errors

```dart
try {
  await client.auth.login(
    const AuthCredentials(email: email, password: password),
  );
} on BakendException catch (error) {
  print('${error.code}: ${error.message}');
}
```

## Flutter Notes

- Use `createLocalStorage` patterns via a custom `AuthStore` backed by `shared_preferences` if you need persistent sessions.
- For file uploads from Flutter, read bytes with `file.readAsBytes()` and pass to `storage.upload`.
- WebSocket realtime works in Flutter web and mobile via `web_socket_channel`.

## See Also

- [JavaScript / TypeScript SDK](./javascript.md)
- [REST API](../api/rest-api.md)
- RFC-0009 SDK Design
