# Bakend Dart SDK

Client library for Dart and Flutter applications connecting to a [Bakend](https://alpbak.github.io/bakend/) server.

## Install

```bash
dart pub add bakend
```

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

## Documentation

- [Dart SDK guide](https://alpbak.github.io/bakend/docs/sdk/dart/)
- [Bakend documentation](https://alpbak.github.io/bakend/docs/)

## License

MIT
