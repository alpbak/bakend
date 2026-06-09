import 'dart:convert';

import 'http_client.dart';

class Collection {
  final BakendHttpClient http;
  final String name;

  Collection({required this.http, required this.name});

  Future<List<Map<String, dynamic>>> list() async {
    final body = await http.request<Map<String, dynamic>>('/api/$name');
    final items = body['items'] as List<dynamic>;
    return items.map((item) => item as Map<String, dynamic>).toList();
  }

  Future<Map<String, dynamic>> get(String id) async {
    return http.request<Map<String, dynamic>>('/api/$name/$id');
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> data) async {
    return http.request<Map<String, dynamic>>(
      '/api/$name',
      method: 'POST',
      body: jsonEncode(data),
    );
  }

  Future<Map<String, dynamic>> update(String id, Map<String, dynamic> data) async {
    return http.request<Map<String, dynamic>>(
      '/api/$name/$id',
      method: 'PUT',
      body: jsonEncode(data),
    );
  }

  Future<void> delete(String id) async {
    await http.request<void>(
      '/api/$name/$id',
      method: 'DELETE',
    );
  }
}
