import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:bakend/bakend.dart';
import 'package:test/test.dart';

late String baseUrl;
Process? _serverProcess;

Future<void> startTestServer() async {
  _serverProcess = await Process.start(
    'bun',
    ['run', 'tests/helpers/sdk-test-server.ts'],
    workingDirectory: Directory.current.parent.parent.path,
  );

  final portLine = await _serverProcess!.stdout
      .transform(utf8.decoder)
      .transform(const LineSplitter())
      .firstWhere((line) => line.startsWith('{'));

  final config = jsonDecode(portLine) as Map<String, dynamic>;
  baseUrl = config['baseUrl'] as String;
}

Future<void> stopTestServer() async {
  _serverProcess?.kill();
  await _serverProcess?.exitCode;
  _serverProcess = null;
}

Future<T> waitFor<T>(
  List<T> items,
  bool Function(T item) predicate, {
  Duration timeout = const Duration(seconds: 3),
}) async {
  final deadline = DateTime.now().add(timeout);
  while (DateTime.now().isBefore(deadline)) {
    for (final item in items) {
      if (predicate(item)) {
        return item;
      }
    }
    await Future<void>.delayed(const Duration(milliseconds: 10));
  }
  throw StateError('Timed out waiting for condition');
}

void main() {
  setUpAll(() async {
    await startTestServer();
  });

  tearDownAll(() async {
    await stopTestServer();
  });

  group('BakendClient', () {
    test('auth register, login, getMe, refresh, logout', () async {
      final client = BakendClient(baseUrl);

      final user = await client.auth.register(
        const AuthCredentials(email: 'dart@example.com', password: 'password123'),
      );
      expect(user.email, 'dart@example.com');
      expect(client.auth.token, isNotNull);

      final me = await client.auth.getMe();
      expect(me.id, user.id);

      client.auth.clear();
      final loggedIn = await client.auth.login(
        const AuthCredentials(email: 'dart@example.com', password: 'password123'),
      );
      expect(loggedIn.email, 'dart@example.com');

      final refreshed = await client.auth.refresh();
      expect(refreshed.id, user.id);

      await client.auth.logout();
      expect(client.auth.token, isNull);

      client.close();
    });

    test('collection CRUD', () async {
      final client = BakendClient(baseUrl);
      final posts = client.collection('posts');

      final created = await posts.create({'title': 'Hello', 'content': 'World'});
      expect(created['title'], 'Hello');
      expect(created['id'], startsWith('rec_'));

      final fetched = await posts.get(created['id'] as String);
      expect(fetched['title'], 'Hello');

      final list = await posts.list();
      expect(list.length, greaterThanOrEqualTo(1));

      final updated = await posts.update(created['id'] as String, {'title': 'Updated'});
      expect(updated['title'], 'Updated');

      await posts.delete(created['id'] as String);
      client.close();
    });

    test('storage upload, download, delete', () async {
      final client = BakendClient(baseUrl);

      await client.auth.register(
        const AuthCredentials(email: 'dart-storage@example.com', password: 'password123'),
      );

      const content = 'hello dart sdk';
      final metadata = await client.storage.upload(
        utf8.encode(content),
        filename: 'test.txt',
        visibility: 'public',
      );

      expect(metadata.id, startsWith('fil_'));
      expect(metadata.filename, 'test.txt');

      final bytes = await client.storage.download(metadata.id);
      expect(utf8.decode(bytes), content);

      await client.storage.delete(metadata.id);
      client.close();
    });

    test('realtime subscribe', () async {
      final client = BakendClient(baseUrl);
      final events = <BakendEvent>[];

      client.realtime.subscribe('posts.created', events.add);
      await Future<void>.delayed(const Duration(milliseconds: 100));

      await client.collection('posts').create({'title': 'Realtime Dart'});

      final event = await waitFor(events, (e) => e.type == 'posts.created');
      expect((event.payload as Map)['title'], 'Realtime Dart');

      client.close();
    });

    test('throws BakendException on invalid login', () async {
      final client = BakendClient(baseUrl);

      expect(
        () => client.auth.login(
          const AuthCredentials(email: 'missing@example.com', password: 'wrong'),
        ),
        throwsA(isA<BakendException>()),
      );

      client.close();
    });
  });
}
