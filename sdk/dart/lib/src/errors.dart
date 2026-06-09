import 'types.dart';

class BakendException implements Exception {
  final String code;
  final String message;
  final int status;
  final List<ValidationDetail>? details;

  const BakendException({
    required this.code,
    required this.message,
    required this.status,
    this.details,
  });

  @override
  String toString() => 'BakendException($code): $message';
}
