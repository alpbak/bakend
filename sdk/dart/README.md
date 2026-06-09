# Bakend Dart SDK

Official client library for [Bakend](https://alpbak.github.io/bakend/) — a SQLite-first backend platform for building MVPs and production apps without juggling infrastructure.

**Bakend = PocketBase + Functions + Jobs**

One executable. One database. Auth, storage, realtime, serverless functions, and scheduled jobs — all in a single binary you can run locally or deploy anywhere.

## What is Bakend?

Bakend is an open-source backend designed to get out of your way:

- **Single-binary deployment** — no Redis, no Kubernetes, no microservices required
- **SQLite-first** — simple, fast, local-first data storage
- **Collections & REST API** — schema-driven CRUD out of the box
- **Authentication** — email/password and session management
- **File storage** — upload and serve files from collections
- **Realtime** — WebSocket subscriptions to collection changes
- **Functions** — TypeScript serverless handlers triggered by events
- **Jobs** — cron-style scheduled tasks
- **Admin dashboard** — built-in UI at `/_`

[Why Bakend exists](https://alpbak.github.io/bakend/docs/why-bakend/) · [Documentation](https://alpbak.github.io/bakend/docs/) · [GitHub](https://github.com/alpbak/bakend)

## What this package provides

The `bakend` package lets Dart and Flutter apps talk to a Bakend server:

| Module | Description |
| --- | --- |
| **Auth** | Register, login, logout, session refresh |
| **Collections** | Create, read, update, delete records |
| **Storage** | Upload and download files |
| **Realtime** | Subscribe to collection create/update/delete events |

Works on the Dart VM, Flutter (iOS, Android, web, desktop), and any platform with `http` and WebSocket support.

## Install

```bash
dart pub add bakend
```

Flutter:

```bash
flutter pub add bakend
```

## Get a Bakend server

```bash
curl -fsSL https://alpbak.github.io/bakend/install.sh | sh
bak init myapp && cd myapp && bak start
```

Server runs at `http://localhost:8080` by default. See the [installation guide](https://alpbak.github.io/bakend/docs/user-guide/installation/).

## Usage

```dart
import 'package:bakend/bakend.dart';

final client = BakendClient('http://localhost:8080');

// Auth
await client.auth.register(
  const AuthCredentials(email: 'user@example.com', password: 'password123'),
);
await client.auth.login(
  const AuthCredentials(email: 'user@example.com', password: 'password123'),
);

// CRUD
final posts = client.collection('posts');
final post = await posts.create({'title': 'Hello', 'body': 'World'});
final all = await posts.list();
await posts.update(post.id, {'title': 'Updated'});
await posts.delete(post.id);

// Realtime
client.realtime.subscribe('posts', (event) {
  print('${event.action}: ${event.record}');
});
```

## Documentation

- [Dart SDK guide](https://alpbak.github.io/bakend/docs/sdk/dart/)
- [User guide](https://alpbak.github.io/bakend/docs/user-guide/)
- [REST API reference](https://alpbak.github.io/bakend/docs/api/rest-api/)
- [JavaScript SDK](https://www.npmjs.com/package/@bakend/client) (`@bakend/client` on npm)

## License

MIT
