import 'dart:convert';

import 'auth.dart';
import 'collection.dart';
import 'http_client.dart';
import 'realtime.dart';
import 'storage.dart';
import 'types.dart';

class BakendClient {
  final BakendHttpClient http;
  final AuthModule auth;
  final StorageModule storage;
  final RealtimeModule realtime;
  final Map<String, Collection> _collections = {};

  factory BakendClient(
    String baseUrl, {
    AuthStore? authStore,
    bool autoRefresh = true,
  }) {
    final store = authStore ?? MemoryAuthStore();
    late final BakendHttpClient httpClient;

    httpClient = BakendHttpClient(
      baseUrl: baseUrl,
      authStore: store,
      autoRefresh: autoRefresh,
      refreshFn: () async {
        final refreshToken = store.getRefreshToken();
        if (refreshToken == null) {
          throw StateError('No refresh token');
        }
        final body = await httpClient.request<Map<String, dynamic>>(
          '/api/auth/refresh',
          method: 'POST',
          body: jsonEncode({'refreshToken': refreshToken}),
          skipAuth: true,
        );
        store.setToken(body['token'] as String);
        store.setRefreshToken(body['refreshToken'] as String);
      },
    );

    return BakendClient._(
      http: httpClient,
      auth: AuthModule(http: httpClient, store: store),
      storage: StorageModule(http: httpClient),
      realtime: RealtimeModule(http: httpClient),
    );
  }

  BakendClient._({
    required this.http,
    required this.auth,
    required this.storage,
    required this.realtime,
  });

  Collection collection(String name) {
    return _collections.putIfAbsent(name, () => Collection(http: http, name: name));
  }

  void close() {
    realtime.disconnect();
    http.close();
  }
}
