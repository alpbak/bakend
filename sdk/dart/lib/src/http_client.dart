import 'dart:convert';

import 'package:http/http.dart' as http;

import 'errors.dart';
import 'types.dart';

typedef RefreshFn = Future<void> Function();

class BakendHttpClient {
  final String baseUrl;
  final AuthStore authStore;
  final bool autoRefresh;
  final RefreshFn? refreshFn;
  final http.Client _client;

  BakendHttpClient({
    required String baseUrl,
    required this.authStore,
    this.autoRefresh = true,
    this.refreshFn,
    http.Client? client,
  })  : baseUrl = baseUrl.replaceAll(RegExp(r'/+$'), ''),
        _client = client ?? http.Client();

  String? get token => authStore.getToken();

  Map<String, String> _authHeaders({bool skipAuth = false}) {
    final headers = <String, String>{};
    if (!skipAuth) {
      final token = authStore.getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  Future<T> request<T>(
    String path, {
    String method = 'GET',
    Map<String, String>? headers,
    Object? body,
    bool skipAuth = false,
    bool isRetry = false,
    T Function(http.Response response)? parse,
  }) async {
    final uri = Uri.parse(path.startsWith('http') ? path : '$baseUrl$path');
    final requestHeaders = <String, String>{
      ..._authHeaders(skipAuth: skipAuth),
      if (headers != null) ...headers,
    };

    if (body is String && !requestHeaders.containsKey('Content-Type')) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    late http.Response response;

    if (body is http.MultipartRequest) {
      if (!skipAuth) {
        requestHeaders.forEach((key, value) {
          body.headers.putIfAbsent(key, () => value);
        });
      }
      final streamed = await body.send();
      response = await http.Response.fromStream(streamed);
    } else {
      switch (method) {
        case 'POST':
          response = await _client.post(
            uri,
            headers: requestHeaders,
            body: body is String ? body : null,
          );
        case 'PUT':
          response = await _client.put(
            uri,
            headers: requestHeaders,
            body: body is String ? body : null,
          );
        case 'DELETE':
          response = await _client.delete(
            uri,
            headers: requestHeaders,
            body: body is String ? body : null,
          );
        default:
          response = await _client.get(uri, headers: requestHeaders);
      }
    }

    if (response.statusCode == 401 &&
        autoRefresh &&
        !skipAuth &&
        !isRetry &&
        refreshFn != null) {
      try {
        await refreshFn!();
        return request<T>(
          path,
          method: method,
          headers: headers,
          body: body,
          skipAuth: skipAuth,
          isRetry: true,
          parse: parse,
        );
      } catch (_) {
        authStore.clear();
        throw _parseError(response);
      }
    }

    if (response.statusCode == 204) {
      return null as T;
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw _parseError(response);
    }

    if (parse != null) {
      return parse(response);
    }

    return jsonDecode(response.body) as T;
  }

  void close() {
    _client.close();
  }

  BakendException _parseError(http.Response response) {
    try {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final error = body['error'] as Map<String, dynamic>?;
      if (error != null) {
        final detailsJson = error['details'] as List<dynamic>?;
        return BakendException(
          code: error['code'] as String,
          message: error['message'] as String,
          status: response.statusCode,
          details: detailsJson
              ?.map((d) => ValidationDetail.fromJson(d as Map<String, dynamic>))
              .toList(),
        );
      }
    } catch (_) {
      // fall through
    }

    return BakendException(
      code: 'unknown',
      message: 'Request failed (${response.statusCode})',
      status: response.statusCode,
    );
  }
}
