import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../network/api_client.dart';

class LicenseVerificationService {
  static final LicenseVerificationService _instance = LicenseVerificationService._internal();
  factory LicenseVerificationService() => _instance;
  LicenseVerificationService._internal();

  final ApiClient _apiClient = ApiClient();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  static const String _licenseKeyStorage = 'app_active_license_key';
  static const String _licenseExpiryStorage = 'app_license_expiry_ts';

  Future<bool> isLicenseActive() async {
    final expiryStr = await _storage.read(key: _licenseExpiryStorage);
    if (expiryStr == null) return true; // Période d'évaluation initiale

    final expiry = int.tryParse(expiryStr) ?? 0;
    final now = DateTime.now().millisecondsSinceEpoch;
    return now < expiry;
  }

  Future<Map<String, dynamic>> redeemLicense(String licenseKey) async {
    try {
      final response = await _apiClient.dio.post(
        '/billing/license/redeem',
        data: {'licenseKey': licenseKey.trim().toUpperCase()},
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data;
        final expiresAtStr = data['expiresAt'];
        if (expiresAtStr != null) {
          final expiryMs = DateTime.parse(expiresAtStr).millisecondsSinceEpoch;
          await _storage.write(key: _licenseExpiryStorage, value: expiryMs.toString());
          await _storage.write(key: _licenseKeyStorage, value: licenseKey);
        }
        return {'success': true, 'message': 'Licence activée avec succès.'};
      }
      return {'success': false, 'message': 'Clé non reconnue.'};
    } catch (e) {
      return {'success': false, 'message': 'Erreur validation : ${e.toString()}'};
    }
  }
}
