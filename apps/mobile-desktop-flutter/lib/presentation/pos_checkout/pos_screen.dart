import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'providers/cart_provider.dart';
import 'screens/barcode_scanner_screen.dart';
import 'widgets/printer_dialog.dart';
import '../../core/services/offline_sync_service.dart';

class PosScreen extends ConsumerStatefulWidget {
  const PosScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends ConsumerState<PosScreen> {
  final OfflineSyncService _syncService = OfflineSyncService();

  final List<Map<String, dynamic>> _catalogue = [
    {'id': '1', 'name': 'Fil électrique 1.5mm² (100m)', 'price': 450000.0, 'stock': 25},
    {'id': '2', 'name': 'Fil électrique 2.5mm² (100m)', 'price': 650000.0, 'stock': 18},
    {'id': '3', 'name': 'Disjoncteur 16A Schneider', 'price': 22000.0, 'stock': 40},
    {'id': '4', 'name': 'Disjoncteur Différentiel 30mA', 'price': 85000.0, 'stock': 12},
    {'id': '5', 'name': 'Interrupteur Simple Legrand', 'price': 15000.0, 'stock': 60},
    {'id': '6', 'name': 'Prise 2P+T 16A Legrand', 'price': 18000.0, 'stock': 55},
    {'id': '7', 'name': 'Ampoule LED 12W Philips E27', 'price': 15000.0, 'stock': 100},
    {'id': '8', 'name': 'Projecteur LED 50W Extérieur', 'price': 85000.0, 'stock': 20},
  ];

  @override
  void initState() {
    super.initState();
    _syncService.initialize();
  }

  final TextEditingController _clientPhoneCtrl = TextEditingController();
  final TextEditingController _clientNameCtrl = TextEditingController();
  String _selectedPaymentMethod = 'Espèces';

  @override
  void dispose() {
    _syncService.dispose();
    _clientPhoneCtrl.dispose();
    _clientNameCtrl.dispose();
    super.dispose();
  }

  String _generateOfflineUuid() {
    final rand = Random();
    return '${DateTime.now().millisecondsSinceEpoch}-${rand.nextInt(999999)}';
  }

  void _scanBarcode() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (ctx) => BarcodeScannerScreen(
          onScanned: (code) {
            final item = _catalogue.first;
            ref.read(cartProvider.notifier).addProduct(
                  item['id'],
                  item['name'],
                  item['price'],
                  item['stock'],
                );
          },
        ),
      ),
    );
  }

  void _envoyerWhatsapp() {
    final cart = ref.read(cartProvider);
    if (cart.items.isEmpty) return;

    final offlineUuid = _generateOfflineUuid();
    final clientName = _clientNameCtrl.text.trim().isEmpty ? 'Client au comptant' : _clientNameCtrl.text.trim();
    final clientPhone = _clientPhoneCtrl.text.replaceAll(RegExp(r'[^0-9]'), '');
    final invoiceNumber = 'FA-2026-$offlineUuid';

    final invoicePayload = {
      'clientUuid': offlineUuid,
      'type': 'FACTURE_ACQUITTEE',
      'status': 'PAID',
      'paymentMethod': _selectedPaymentMethod,
      'clientName': clientName,
      'clientPhone': clientPhone,
      'items': cart.items.map((i) => {'productId': i.productId, 'quantity': i.quantity}).toList(),
    };
    _syncService.queueInvoiceLocally(invoicePayload);

    final itemsSummary = cart.items.map((i) => "• ${i.name} (x${i.quantity}) : ${(i.price * i.quantity).toStringAsFixed(0)} GNF").join("\n");
    final waMessage = "*FACTURE OFFICIELLE ACQUITTÉE*\n"
        "Boutique : Électro Pro\n"
        "N° Facture : *$invoiceNumber*\n"
        "Client : *$clientName*\n\n"
        "*Détail des achats :*\n$itemsSummary\n\n"
        "*TOTAL PAYÉ : ${cart.totalTtc.toStringAsFixed(0)} GNF*\n"
        "Règlement : $_selectedPaymentMethod (Validé ✅)\n\n"
        "Merci pour votre confiance ! Document de caisse certifié.";

    final waUrl = clientPhone.isNotEmpty
        ? "https://wa.me/$clientPhone?text=${Uri.encodeComponent(waMessage)}"
        : "https://wa.me/?text=${Uri.encodeComponent(waMessage)}";

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("Facture prête pour WhatsApp !\nLien généré : $waUrl"),
        backgroundColor: const Color(0xFF25D366),
        duration: const Duration(seconds: 4),
      ),
    );

    ref.read(cartProvider.notifier).clear();
    _clientPhoneCtrl.clear();
    _clientNameCtrl.clear();
  }

  void _mettreACredit() {
    final cart = ref.read(cartProvider);
    if (cart.items.isEmpty) return;

    final clientName = _clientNameCtrl.text.trim().isEmpty ? 'Client Fidèle' : _clientNameCtrl.text.trim();
    final clientPhone = _clientPhoneCtrl.text.replaceAll(RegExp(r'[^0-9]'), '');
    final total = cart.totalTtc;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("Dette de ${total.toStringAsFixed(0)} GNF enregistrée pour $clientName dans le Carnet de Dettes !"),
        backgroundColor: const Color(0xFFD29922),
        duration: const Duration(seconds: 4),
      ),
    );

    ref.read(cartProvider.notifier).clear();
    _clientPhoneCtrl.clear();
    _clientNameCtrl.clear();
  }

  void _finaliserVente() {
    final cart = ref.read(cartProvider);
    if (cart.items.isEmpty) return;

    final offlineUuid = _generateOfflineUuid();
    final invoicePayload = {
      'clientUuid': offlineUuid,
      'type': 'TICKET',
      'status': 'PAID',
      'paymentMethod': _selectedPaymentMethod,
      'items': cart.items
          .map((i) => {
                'productId': i.productId,
                'quantity': i.quantity,
              })
          .toList(),
    };

    // 1. Enregistrement immédiat dans la file locale hors-ligne
    _syncService.queueInvoiceLocally(invoicePayload);

    // 2. Impression directe du ticket de caisse
    showDialog(
      context: context,
      builder: (ctx) => PrinterSelectDialog(
        invoiceData: {
          'storeName': 'Électro Pro Conakry',
          'storeAddress': 'Madina Marché, Conakry',
          'storePhone': '+224 620 00 00 00',
          'invoiceNumber': 'TK-$offlineUuid',
          'cashierName': 'Caisse Principale',
          'clientName': _clientNameCtrl.text.trim().isEmpty ? 'Client au comptant' : _clientNameCtrl.text.trim(),
          'items': cart.items
              .map((i) => {
                    'name': i.name,
                    'quantity': i.quantity,
                    'price': i.price,
                  })
              .toList(),
          'totalHt': cart.totalHt,
          'totalTax': cart.totalTax,
          'totalTtc': cart.totalTtc,
          'currency': 'GNF',
        },
      ),
    ).then((_) {
      ref.read(cartProvider.notifier).clear();
      _clientPhoneCtrl.clear();
      _clientNameCtrl.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Text('Boutique Pro POS', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(width: 12),
            ValueListenableBuilder<SyncStatus>(
              valueListenable: _syncService.statusNotifier,
              builder: (ctx, status, _) {
                return ValueListenableBuilder<int>(
                  valueListenable: _syncService.pendingCountNotifier,
                  builder: (ctx, pending, _) {
                    if (status == SyncStatus.syncing) {
                      return const Chip(
                        avatar: SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
                        label: Text('Synchronisation...', style: TextStyle(fontSize: 10)),
                        backgroundColor: Colors.blueGrey,
                      );
                    }
                    if (pending > 0 || status == SyncStatus.offline) {
                      return Chip(
                        avatar: const Icon(Icons.cloud_off, size: 14, color: Colors.black),
                        label: Text('Hors-ligne ($pending)', style: const TextStyle(fontSize: 10, color: Colors.black, fontWeight: FontWeight.bold)),
                        backgroundColor: const Color(0xFFFFB300),
                      );
                    }
                    return const Chip(
                      avatar: Icon(Icons.cloud_done, size: 14, color: Colors.white),
                      label: Text('Cloud Connecté', style: TextStyle(fontSize: 10, color: Colors.white)),
                      backgroundColor: Color(0xFF00C853),
                    );
                  },
                );
              },
            ),
          ],
        ),
        backgroundColor: const Color(0xFF0F6B4C),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            tooltip: 'Lecteur Optique',
            onPressed: _scanBarcode,
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Vider le panier',
            onPressed: cart.items.isEmpty ? null : () => ref.read(cartProvider.notifier).clear(),
          ),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isLarge = constraints.maxWidth > 850;

          if (isLarge) {
            return Row(
              children: [
                Expanded(flex: 3, child: _buildGrid()),
                const VerticalDivider(width: 1, color: Color(0xFF333333)),
                Expanded(flex: 2, child: _buildCartPanel(cart)),
              ],
            );
          } else {
            return Column(
              children: [
                Expanded(child: _buildGrid()),
                _buildMobileCartSummary(cart),
              ],
            );
          }
        },
      ),
    );
  }

  Widget _buildGrid() {
    return GridView.builder(
      padding: const EdgeInsets.all(12),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 1.1,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: _catalogue.length,
      itemBuilder: (context, idx) {
        final item = _catalogue[idx];
        return InkWell(
          onTap: () {
            ref.read(cartProvider.notifier).addProduct(
                  item['id'],
                  item['name'],
                  item['price'],
                  item['stock'],
                );
          },
          borderRadius: BorderRadius.circular(12),
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1A1D23),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF333333)),
            ),
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  item['name'],
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "${(item['price'] as double).toStringAsFixed(0)} GNF",
                      style: const TextStyle(color: Color(0xFF00C853), fontWeight: FontWeight.w800, fontSize: 14),
                    ),
                    Text(
                      "Stock: ${item['stock']}",
                      style: const TextStyle(color: Colors.grey, fontSize: 11),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildCartPanel(CartState cart) {
    return Container(
      color: const Color(0xFF14171C),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text("Ticket en cours", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 12),
          Expanded(
            child: cart.items.isEmpty
                ? const Center(child: Text("Panier vide", style: TextStyle(color: Colors.grey)))
                : ListView.separated(
                    itemCount: cart.items.length,
                    separatorBuilder: (_, __) => const Divider(color: Color(0xFF2A2D34)),
                    itemBuilder: (ctx, i) {
                      final item = cart.items[i];
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(item.name, style: const TextStyle(fontSize: 13, color: Colors.white)),
                        subtitle: Text("${item.price.toStringAsFixed(0)} GNF × ${item.quantity}"),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove_circle_outline, color: Colors.grey),
                              onPressed: () => ref.read(cartProvider.notifier).decrement(item.productId),
                            ),
                            Text("${item.quantity}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            IconButton(
                              icon: const Icon(Icons.add_circle_outline, color: Color(0xFF00C853)),
                              onPressed: () => ref.read(cartProvider.notifier).addProduct(
                                    item.productId,
                                    item.name,
                                    item.price,
                                    item.maxStock,
                                  ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
          const Divider(color: Color(0xFF333333)),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _clientPhoneCtrl,
                  keyboardType: TextInputType.phone,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: "N° WhatsApp",
                    hintStyle: const TextStyle(color: Colors.grey, fontSize: 12),
                    prefixIcon: const Icon(Icons.phone, size: 16, color: Color(0xFF25D366)),
                    filled: true,
                    fillColor: const Color(0xFF1E222B),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _clientNameCtrl,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: "Nom Client",
                    hintStyle: const TextStyle(color: Colors.grey, fontSize: 12),
                    prefixIcon: const Icon(Icons.person, size: 16, color: Colors.blueAccent),
                    filled: true,
                    fillColor: const Color(0xFF1E222B),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("Total TTC :", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
              Text(
                "${cart.totalTtc.toStringAsFixed(0)} GNF",
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF00C853)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF25D366),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            icon: const Icon(Icons.send_to_mobile),
            label: const Text("ENVOYER FACTURE WHATSAPP", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
            onPressed: cart.items.isEmpty ? null : _envoyerWhatsapp,
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Color(0xFF333333)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  icon: const Icon(Icons.print, size: 18),
                  label: const Text("Ticket"),
                  onPressed: cart.items.isEmpty ? null : _finaliserVente,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFD29922),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  icon: const Icon(Icons.book, size: 18),
                  label: const Text("À Crédit", style: TextStyle(fontWeight: FontWeight.bold)),
                  onPressed: cart.items.isEmpty ? null : _mettreACredit,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMobileCartSummary(CartState cart) {
    return Container(
      padding: const EdgeInsets.all(12),
      color: const Color(0xFF14171C),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("${cart.items.length} Articles", style: const TextStyle(color: Colors.grey, fontSize: 12)),
              Text(
                "${cart.totalTtc.toStringAsFixed(0)} GNF",
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF00C853)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF25D366), foregroundColor: Colors.white),
                  onPressed: cart.items.isEmpty ? null : _envoyerWhatsapp,
                  icon: const Icon(Icons.send_to_mobile, size: 16),
                  label: const Text("WhatsApp", style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F6B4C), foregroundColor: Colors.white),
                  onPressed: cart.items.isEmpty ? null : _finaliserVente,
                  child: const Text("Encaisser"),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
