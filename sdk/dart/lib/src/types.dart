class AuthUser {
  final String id;
  final String email;
  final String role;
  final String createdAt;

  const AuthUser({
    required this.id,
    required this.email,
    required this.role,
    required this.createdAt,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      createdAt: json['createdAt'] as String,
    );
  }
}

class AuthCredentials {
  final String email;
  final String password;

  const AuthCredentials({required this.email, required this.password});

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
      };
}

class AuthTokens {
  final String token;
  final String refreshToken;
  final AuthUser user;

  const AuthTokens({
    required this.token,
    required this.refreshToken,
    required this.user,
  });

  factory AuthTokens.fromJson(Map<String, dynamic> json) {
    return AuthTokens(
      token: json['token'] as String,
      refreshToken: json['refreshToken'] as String,
      user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}

class ValidationDetail {
  final String field;
  final String rule;
  final String message;

  const ValidationDetail({
    required this.field,
    required this.rule,
    required this.message,
  });

  factory ValidationDetail.fromJson(Map<String, dynamic> json) {
    return ValidationDetail(
      field: json['field'] as String,
      rule: json['rule'] as String,
      message: json['message'] as String,
    );
  }
}

class FileMetadata {
  final String id;
  final String filename;
  final String mimeType;
  final int size;
  final String visibility;
  final String userId;
  final String createdAt;

  const FileMetadata({
    required this.id,
    required this.filename,
    required this.mimeType,
    required this.size,
    required this.visibility,
    required this.userId,
    required this.createdAt,
  });

  factory FileMetadata.fromJson(Map<String, dynamic> json) {
    return FileMetadata(
      id: json['id'] as String,
      filename: json['filename'] as String,
      mimeType: json['mimeType'] as String,
      size: json['size'] as int,
      visibility: json['visibility'] as String,
      userId: json['userId'] as String,
      createdAt: json['createdAt'] as String,
    );
  }
}

class BakendEvent {
  final String id;
  final String type;
  final String timestamp;
  final String source;
  final dynamic payload;

  const BakendEvent({
    required this.id,
    required this.type,
    required this.timestamp,
    required this.source,
    required this.payload,
  });

  factory BakendEvent.fromJson(Map<String, dynamic> json) {
    return BakendEvent(
      id: json['id'] as String,
      type: json['type'] as String,
      timestamp: json['timestamp'] as String,
      source: json['source'] as String,
      payload: json['payload'],
    );
  }
}

typedef RealtimeEventHandler = void Function(BakendEvent event);

abstract class AuthStore {
  String? getToken();
  void setToken(String token);
  String? getRefreshToken();
  void setRefreshToken(String token);
  void clear();
}

class MemoryAuthStore implements AuthStore {
  String? _token;
  String? _refreshToken;

  @override
  String? getToken() => _token;

  @override
  void setToken(String token) => _token = token;

  @override
  String? getRefreshToken() => _refreshToken;

  @override
  void setRefreshToken(String token) => _refreshToken = token;

  @override
  void clear() {
    _token = null;
    _refreshToken = null;
  }
}
