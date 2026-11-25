import 'package:flutter/material.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import '../../../core/services/thermal_printer_service.dart';

class PrinterSelectDialog extends StatefulWidget {
  final Map<String, dynamic> invoiceData;

  const PrinterSelectDialog({Key? key, required this.invoiceData}) : super(key: key);

  @override
  State<PrinterSelectDialog> createState() => _PrinterSelectDialogState();
}

class _PrinterSelectDialogState extends State<PrinterSelectDialog> {
  final ThermalPrinterService _printerService = ThermalPrinterService();
  List<BluetoothInfo> _printers = [];
  bool _isLoading = true;
  PaperSizeWidth _selectedWidth = PaperSizeWidth.mm80;

  @override
  void initState() {
    super.initState();
    _loadPrinters();
  }

  Future<void> _loadPrinters() async {
    try {
      final list = await _printerService.getPairedPrinters();
      setState(() {
        _printers = list;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Scan Bluetooth : ${e.toString()}"), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _handlePrint(String macAddress) async {
    setState(() => _isLoading = true);
    try {
      final connected = await _printerService.connectToPrinter(macAddress);
      if (!connected) throw Exception("Échec de connexion Bluetooth");

      final bytes = await _printerService.generateTicketBytes(
        paperWidth: _selectedWidth,
        storeName: widget.invoiceData['storeName'] ?? 'Boutique Pro',
        storeAddress: widget.invoiceData['storeAddress'] ?? '',
        storePhone: widget.invoiceData['storePhone'] ?? '',
        invoiceNumber: widget.invoiceData['invoiceNumber'] ?? 'TK-2026-0001',
        cashierName: widget.invoiceData['cashierName'] ?? 'Caisse Principale',
        clientName: widget.invoiceData['clientName'] ?? 'Client au comptant',
        items: List<Map<String, dynamic>>.from(widget.invoiceData['items']),
        totalHt: (widget.invoiceData['totalHt'] as num).toDouble(),
        totalTax: (widget.invoiceData['totalTax'] as num).toDouble(),
        totalTtc: (widget.invoiceData['totalTtc'] as num).toDouble(),
        currency: widget.invoiceData['currency'] ?? 'GNF',
      );

      await _printerService.printTicket(bytes);
      if (mounted) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Ticket ESC/POS imprimé !"), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Erreur impression : ${e.toString()}"), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text("Imprimante Thermique Bluetooth"),
      content: SizedBox(
        width: 420,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                const Text("Largeur : "),
                DropdownButton<PaperSizeWidth>(
                  value: _selectedWidth,
                  items: const [
                    DropdownMenuItem(value: PaperSizeWidth.mm80, child: Text("80 mm")),
                    DropdownMenuItem(value: PaperSizeWidth.mm58, child: Text("58 mm")),
                  ],
                  onChanged: (v) => setState(() => _selectedWidth = v!),
                ),
              ],
            ),
            const Divider(),
            if (_isLoading)
              const Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator())
            else if (_printers.isEmpty)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text("Aucune imprimante appairée trouvée. Activez le Bluetooth."),
              )
            else
              ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 250),
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: _printers.length,
                  itemBuilder: (ctx, i) {
                    final p = _printers[i];
                    return ListTile(
                      leading: const Icon(Icons.print, color: Color(0xFF0F6B4C)),
                      title: Text(p.name),
                      subtitle: Text(p.macAdress),
                      trailing: ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F6B4C)),
                        onPressed: () => _handlePrint(p.macAdress),
                        child: const Text("Imprimer"),
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text("Annuler")),
      ],
    );
  }
}
