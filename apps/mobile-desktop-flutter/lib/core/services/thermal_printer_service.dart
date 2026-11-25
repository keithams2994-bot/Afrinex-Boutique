import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:permission_handler/permission_handler.dart';

enum PaperSizeWidth { mm58, mm80 }

class ThermalPrinterService {
  static final ThermalPrinterService _instance = ThermalPrinterService._internal();
  factory ThermalPrinterService() => _instance;
  ThermalPrinterService._internal();

  Future<bool> checkPermissions() async {
    Map<Permission, PermissionStatus> statuses = await [
      Permission.bluetooth,
      Permission.bluetoothScan,
      Permission.bluetoothConnect,
      Permission.location,
    ].request();

    return statuses.values.every((status) => status.isGranted);
  }

  Future<List<BluetoothInfo>> getPairedPrinters() async {
    final hasPerm = await checkPermissions();
    if (!hasPerm) throw Exception("Permissions Bluetooth requises non accordées");
    return await PrintBluetoothThermal.pairedBluetooths;
  }

  Future<bool> connectToPrinter(String macAddress) async {
    final isConnected = await PrintBluetoothThermal.connectionStatus;
    if (isConnected) await PrintBluetoothThermal.disconnect;
    return await PrintBluetoothThermal.connect(macPrinterAddress: macAddress);
  }

  Future<void> disconnect() async {
    await PrintBluetoothThermal.disconnect;
  }

  String _sanitizeText(String text) {
    return text
        .replaceAll('é', 'e')
        .replaceAll('è', 'e')
        .replaceAll('ê', 'e')
        .replaceAll('à', 'a')
        .replaceAll('â', 'a')
        .replaceAll('ç', 'c')
        .replaceAll('î', 'i')
        .replaceAll('ï', 'i')
        .replaceAll('ô', 'o')
        .replaceAll('ù', 'u')
        .replaceAll('û', 'u')
        .replaceAll('€', 'EUR');
  }

  Future<List<int>> generateTicketBytes({
    required PaperSizeWidth paperWidth,
    required String storeName,
    required String storeAddress,
    required String storePhone,
    required String invoiceNumber,
    required String cashierName,
    required String clientName,
    required List<Map<String, dynamic>> items,
    required double totalHt,
    required double totalTax,
    required double totalTtc,
    required String currency,
  }) async {
    final profile = await CapabilityProfile.load();
    final generator = Generator(
      paperWidth == PaperSizeWidth.mm80 ? PaperSize.mm80 : PaperSize.mm58,
      profile,
    );

    List<int> bytes = [];

    bytes += generator.reset();
    bytes += generator.text(
      _sanitizeText(storeName),
      styles: const PosStyles(
        align: PosAlign.center,
        height: PosTextSize.size2,
        width: PosTextSize.size2,
        bold: true,
      ),
    );

    if (storeAddress.isNotEmpty) {
      bytes += generator.text(_sanitizeText(storeAddress), styles: const PosStyles(align: PosAlign.center));
    }
    if (storePhone.isNotEmpty) {
      bytes += generator.text('Tel: ${_sanitizeText(storePhone)}', styles: const PosStyles(align: PosAlign.center));
    }

    bytes += generator.hr(ch: '=');
    bytes += generator.text('Ticket : $invoiceNumber', styles: const PosStyles(bold: true));
    bytes += generator.text('Date   : ${DateTime.now().toString().substring(0, 16)}');
    bytes += generator.text('Oper.  : ${_sanitizeText(cashierName)}');
    if (clientName.isNotEmpty && clientName != 'Client au comptant') {
      bytes += generator.text('Client : ${_sanitizeText(clientName)}');
    }

    bytes += generator.hr();

    for (var itm in items) {
      final name = _sanitizeText(itm['name'].toString());
      final qte = itm['quantity'].toString();
      final price = (itm['price'] as num).toDouble();
      final subtotal = price * (itm['quantity'] as num);

      if (paperWidth == PaperSizeWidth.mm80) {
        bytes += generator.row([
          PosColumn(text: name.length > 20 ? '${name.substring(0, 18)}..' : name, width: 6),
          PosColumn(text: qte, width: 2, styles: const PosStyles(align: PosAlign.center)),
          PosColumn(text: price.toStringAsFixed(0), width: 2, styles: const PosStyles(align: PosAlign.right)),
          PosColumn(text: subtotal.toStringAsFixed(0), width: 2, styles: const PosStyles(align: PosAlign.right)),
        ]);
      } else {
        bytes += generator.row([
          PosColumn(text: name.length > 14 ? '${name.substring(0, 12)}..' : name, width: 6),
          PosColumn(text: 'x$qte', width: 2, styles: const PosStyles(align: PosAlign.center)),
          PosColumn(text: subtotal.toStringAsFixed(0), width: 4, styles: const PosStyles(align: PosAlign.right)),
        ]);
      }
    }

    bytes += generator.hr();
    bytes += generator.row([
      PosColumn(text: 'Total HT', width: 6),
      PosColumn(text: '${totalHt.toStringAsFixed(0)} $currency', width: 6, styles: const PosStyles(align: PosAlign.right)),
    ]);
    bytes += generator.row([
      PosColumn(text: 'TVA', width: 6),
      PosColumn(text: '${totalTax.toStringAsFixed(0)} $currency', width: 6, styles: const PosStyles(align: PosAlign.right)),
    ]);
    bytes += generator.row([
      PosColumn(text: 'TOTAL TTC', width: 6, styles: const PosStyles(bold: true, height: PosTextSize.size2)),
      PosColumn(text: '${totalTtc.toStringAsFixed(0)} $currency', width: 6, styles: const PosStyles(bold: true, align: PosAlign.right, height: PosTextSize.size2)),
    ]);

    bytes += generator.hr(ch: '=');
    bytes += generator.text('*** FACTURE REGLEE ***', styles: const PosStyles(align: PosAlign.center, bold: true));
    bytes += generator.text('Merci de votre visite !', styles: const PosStyles(align: PosAlign.center));
    bytes += generator.feed(3);
    bytes += generator.cut();

    return bytes;
  }

  Future<bool> printTicket(List<int> bytes) async {
    final isConnected = await PrintBluetoothThermal.connectionStatus;
    if (!isConnected) throw Exception("Imprimante non connectée via Bluetooth");
    return await PrintBluetoothThermal.writeBytes(bytes);
  }
}
