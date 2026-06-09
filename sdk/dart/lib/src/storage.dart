import 'package:http/http.dart' as http;

import 'http_client.dart';
import 'types.dart';

class StorageModule {
  final BakendHttpClient httpClient;

  StorageModule({required BakendHttpClient http}) : httpClient = http;

  Future<FileMetadata> upload(
    List<int> bytes, {
    String filename = 'file',
    String visibility = 'protected',
  }) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('${httpClient.baseUrl}/api/storage/upload'),
    );
    request.fields['visibility'] = visibility;
    request.files.add(
      http.MultipartFile.fromBytes(
        'file',
        bytes,
        filename: filename,
      ),
    );

    final body = await httpClient.request<Map<String, dynamic>>(
      '/api/storage/upload',
      method: 'POST',
      body: request,
    );
    return FileMetadata.fromJson(body);
  }

  Future<List<int>> download(String id) async {
    return httpClient.request<List<int>>(
      '/api/storage/$id',
      parse: (response) => response.bodyBytes,
    );
  }

  String getDownloadUrl(String id) => '${httpClient.baseUrl}/api/storage/$id';

  Future<void> delete(String id) async {
    await httpClient.request<void>(
      '/api/storage/$id',
      method: 'DELETE',
    );
  }
}
