import 'dart:async';
import 'dart:convert';

import 'package:web_socket_channel/web_socket_channel.dart';

import 'http_client.dart';
import 'types.dart';

class RealtimeModule {
  final BakendHttpClient http;
  WebSocketChannel? _channel;
  final Map<String, Set<RealtimeEventHandler>> _handlers = {};
  Completer<void>? _connectCompleter;

  RealtimeModule({required this.http});

  String _wsUrl() {
    final wsBase = http.baseUrl.replaceFirst(RegExp(r'^http'), 'ws');
    final token = http.token;
    if (token != null) {
      return '$wsBase/api/realtime?token=${Uri.encodeComponent(token)}';
    }
    return '$wsBase/api/realtime';
  }

  Future<void> _ensureConnected() async {
    if (_channel != null) {
      return;
    }

    if (_connectCompleter != null) {
      return _connectCompleter!.future;
    }

    _connectCompleter = Completer<void>();
    try {
      _channel = WebSocketChannel.connect(Uri.parse(_wsUrl()));
      _channel!.stream.listen(
        _handleMessage,
        onError: (_) {
          _channel = null;
          _connectCompleter = null;
        },
        onDone: () {
          _channel = null;
          _connectCompleter = null;
        },
      );
      _connectCompleter!.complete();
    } catch (error) {
      _connectCompleter!.completeError(error);
      _connectCompleter = null;
      rethrow;
    }
  }

  bool _matchesChannel(String subscription, String eventType) {
    if (subscription == eventType) {
      return true;
    }
    if (subscription.endsWith('.*')) {
      final prefix = subscription.substring(0, subscription.length - 1);
      return eventType.startsWith(prefix);
    }
    return false;
  }

  void _handleMessage(dynamic raw) {
    Map<String, dynamic> message;
    try {
      message = jsonDecode(raw as String) as Map<String, dynamic>;
    } catch (_) {
      return;
    }

    if (message['type'] != 'event') {
      return;
    }

    final event = BakendEvent.fromJson(message['event'] as Map<String, dynamic>);
    for (final entry in _handlers.entries) {
      if (_matchesChannel(entry.key, event.type)) {
        for (final handler in entry.value) {
          handler(event);
        }
      }
    }
  }

  void _send(Map<String, String> data) {
    _channel?.sink.add(jsonEncode(data));
  }

  void subscribe(String channel, RealtimeEventHandler handler) {
    _handlers.putIfAbsent(channel, () => {}).add(handler);
    unawaited(_ensureConnected().then((_) {
      _send({'action': 'subscribe', 'channel': channel});
    }));
  }

  void unsubscribe(String channel, [RealtimeEventHandler? handler]) {
    final handlers = _handlers[channel];
    if (handlers == null) {
      return;
    }

    if (handler != null) {
      handlers.remove(handler);
      if (handlers.isEmpty) {
        _handlers.remove(channel);
        _send({'action': 'unsubscribe', 'channel': channel});
      }
    } else {
      _handlers.remove(channel);
      _send({'action': 'unsubscribe', 'channel': channel});
    }
  }

  void ping() {
    unawaited(_ensureConnected().then((_) {
      _send({'action': 'ping'});
    }));
  }

  void disconnect() {
    _channel?.sink.close();
    _channel = null;
    _handlers.clear();
    _connectCompleter = null;
  }
}
