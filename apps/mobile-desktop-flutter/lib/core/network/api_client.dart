import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  final Dio dio = Dio();
  final FlutterSecureStorage storage = const FlutterSecureStorage();

  ApiClient() {
    dio.options.baseUrl = "https://api.votre-saas.com/v1";
    dio.options.connectTimeout = const Duration(seconds: 10);
    dio.options.receiveTimeout = const Duration(seconds: 10);

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await storage.read(key: 'jwt_token');
          final tenantId = await storage.read(key: 'tenant_id');

          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          if (tenantId != null) {
            options.headers['x-tenant-id'] = tenantId;
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) {
          return handler.next(error);
        },
      ),
    );
  }
}
