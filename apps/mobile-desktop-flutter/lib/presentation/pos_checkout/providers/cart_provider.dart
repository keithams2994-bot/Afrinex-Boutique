import 'package:flutter_riverpod/flutter_riverpod.dart';

class CartItem {
  final String productId;
  final String name;
  final double price;
  final int quantity;
  final int maxStock;

  CartItem({
    required this.productId,
    required this.name,
    required this.price,
    required this.quantity,
    required this.maxStock,
  });

  CartItem copyWith({int? quantity}) {
    return CartItem(
      productId: productId,
      name: name,
      price: price,
      quantity: quantity ?? this.quantity,
      maxStock: maxStock,
    );
  }
}

class CartState {
  final List<CartItem> items;
  final double taxRate;

  CartState({this.items = const [], this.taxRate = 0.18});

  double get totalHt => items.fold(0.0, (acc, item) => acc + (item.price * item.quantity));
  double get totalTax => totalHt * taxRate;
  double get totalTtc => totalHt + totalTax;
}

class CartNotifier extends StateNotifier<CartState> {
  CartNotifier() : super(CartState());

  void addProduct(String id, String name, double price, int stock) {
    final index = state.items.indexWhere((i) => i.productId == id);

    if (index >= 0) {
      final currentItem = state.items[index];
      if (currentItem.quantity >= stock) return;

      final updatedList = List<CartItem>.from(state.items);
      updatedList[index] = currentItem.copyWith(quantity: currentItem.quantity + 1);
      state = CartState(items: updatedList, taxRate: state.taxRate);
    } else {
      if (stock <= 0) return;
      state = CartState(
        items: [...state.items, CartItem(productId: id, name: name, price: price, quantity: 1, maxStock: stock)],
        taxRate: state.taxRate,
      );
    }
  }

  void decrement(String id) {
    final index = state.items.indexWhere((i) => i.productId == id);
    if (index < 0) return;

    final currentItem = state.items[index];
    final updatedList = List<CartItem>.from(state.items);

    if (currentItem.quantity > 1) {
      updatedList[index] = currentItem.copyWith(quantity: currentItem.quantity - 1);
    } else {
      updatedList.removeAt(index);
    }
    state = CartState(items: updatedList, taxRate: state.taxRate);
  }

  void removeItem(String id) {
    state = CartState(
      items: state.items.where((i) => i.productId != id).toList(),
      taxRate: state.taxRate,
    );
  }

  void clear() {
    state = CartState(items: [], taxRate: state.taxRate);
  }
}

final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  return CartNotifier();
});
