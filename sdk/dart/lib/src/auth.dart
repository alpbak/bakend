import 'dart:convert';

import 'http_client.dart';
import 'types.dart';

class AuthModule {
  final BakendHttpClient http;
  final AuthStore store;

  AuthModule({required this.http, required this.store});

  String? get token => store.getToken();
  String? get refreshToken => store.getRefreshToken();

  AuthUser _saveTokens(AuthTokens tokens) {
    store.setToken(tokens.token);
    store.setRefreshToken(tokens.refreshToken);
    return tokens.user;
  }

  Future<AuthUser> register(AuthCredentials credentials) async {
    final body = await http.request<Map<String, dynamic>>(
      '/api/auth/register',
      method: 'POST',
      body: jsonEncode(credentials.toJson()),
      skipAuth: true,
    );
    return _saveTokens(AuthTokens.fromJson(body));
  }

  Future<AuthUser> login(AuthCredentials credentials) async {
    final body = await http.request<Map<String, dynamic>>(
      '/api/auth/login',
      method: 'POST',
      body: jsonEncode(credentials.toJson()),
      skipAuth: true,
    );
    return _saveTokens(AuthTokens.fromJson(body));
  }

  Future<AuthUser> refresh([String? refreshTokenValue]) async {
    final token = refreshTokenValue ?? store.getRefreshToken();
    if (token == null) {
      throw StateError('No refresh token available');
    }

    final body = await http.request<Map<String, dynamic>>(
      '/api/auth/refresh',
      method: 'POST',
      body: jsonEncode({'refreshToken': token}),
      skipAuth: true,
    );
    return _saveTokens(AuthTokens.fromJson(body));
  }

  Future<void> logout([String? refreshTokenValue]) async {
    final token = refreshTokenValue ?? store.getRefreshToken();
    if (token != null) {
      await http.request<void>(
        '/api/auth/logout',
        method: 'POST',
        body: jsonEncode({'refreshToken': token}),
        skipAuth: true,
      );
    }
    store.clear();
  }

  Future<AuthUser> getMe() async {
    final body = await http.request<Map<String, dynamic>>('/api/auth/me');
    return AuthUser.fromJson(body['user'] as Map<String, dynamic>);
  }

  void clear() => store.clear();
}
