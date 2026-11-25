import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../network/api_client.dart';

enum SyncStatus { online, offline, syncing }

class OfflineSyncService {
  static final OfflineSyncService _instance = OfflineSyncService._internal();
  factory OfflineSyncService() => _instance;
  OfflineSyncService._internal();

  final ApiClient _apiClient = ApiClient();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  static const String _outboxKey = 'pos_local_outbox_queue';

  final ValueNotifier<SyncStatus> statusNotifier = ValueNotifier<SyncStatus>(SyncStatus.online);
  final ValueNotifier<int> pendingCountNotifier = ValueNotifier<int>(0);
  Timer? _syncTimer;

  void initialize() {
    _refreshPendingCount();
    // Sonde de synchronisation automatique toutes les 15 secondes
    _syncTimer = Timer.periodic(const Duration(seconds: 15), (_) => triggerSync());
  }

  void dispose() {
    _syncTimer?.cancel();
  }

  Future<void> _refreshPendingCount() async {
    final queue = await getPendingQueue();
    pendingCountNotifier.value = queue.length;
  }

  Future<List<Map<String, dynamic>>> getPendingQueue() async {
    final raw = await _storage.read(key: _outboxKey);
    if (raw == null || raw.isEmpty) return [];
    try {
      final List<dynamic> list = jsonDecode(raw);
      return list.cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }

  Future<void> queueInvoiceLocally(Map<String, dynamic> invoicePayload) async {
    final queue = await getPendingQueue();
    queue.add(invoicePayload);
    await _storage.write(key: _outboxKey, value: jsonEncode(queue));
    await _refreshPendingCount();

    // Tente de pousser immédiatement
    triggerSync();
  }

  Future<void> triggerSync() async {
    final queue = await getPendingQueue();
    if (queue.isEmpty) {
      statusNotifier.value = SyncStatus.online;
      return;
    }

    statusNotifier.value = SyncStatus.syncing;

    try {
      final response = await _apiClient.dio.post(
        '/invoices/sync-batch',
        data: {'invoices': queue},
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Vider la file locale après succès confirmé par le serveur
        await _storage.delete(key: _outboxKey);
        await _refreshPendingCount();
        statusNotifier.value = SyncStatus.online;
      } else {
        statusNotifier.value = SyncStatus.offline;
      }
    } catch (e) {
      // Échec de connectivité (4G coupée ou serveur injoignable)
      statusNotifier.value = SyncStatus.offline;
    }
  }
}
