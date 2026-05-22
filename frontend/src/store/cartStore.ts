import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  variant_id: string;
  product_id: string;
  name: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  image_url?: string;
  stock: number;
}

interface CartState {
  items: CartItem[];
  selectedItemIds: string[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (variant_id: string) => void;
  updateQuantity: (variant_id: string, quantity: number) => void;
  toggleSelectItem: (variant_id: string) => void;
  toggleSelectGroup: (product_id: string, isSelected: boolean) => void;
  toggleSelectAll: () => void;
  getSelectedItems: () => CartItem[];
  removeSelectedItems: () => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getSelectedTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedItemIds: [],
      
      addToCart: (newItem) => {
        set((state) => {
          // Auto-select the newly added item if not already selected
          const newSelected = state.selectedItemIds.includes(newItem.variant_id) 
            ? state.selectedItemIds 
            : [...state.selectedItemIds, newItem.variant_id];

          const existingItem = state.items.find(i => i.variant_id === newItem.variant_id);
          if (existingItem) {
            const newQuantity = Math.min(existingItem.quantity + newItem.quantity, existingItem.stock);
            return {
              items: state.items.map(i => 
                i.variant_id === newItem.variant_id 
                  ? { ...i, quantity: newQuantity } 
                  : i
              ),
              selectedItemIds: newSelected
            };
          }
          return { items: [...state.items, newItem], selectedItemIds: newSelected };
        });
      },

      removeFromCart: (variant_id) => {
        set((state) => ({
          items: state.items.filter(i => i.variant_id !== variant_id),
          selectedItemIds: state.selectedItemIds.filter(id => id !== variant_id)
        }));
      },

      updateQuantity: (variant_id, quantity) => {
        set((state) => ({
          items: state.items.map(i => {
            if (i.variant_id === variant_id) {
              const validQuantity = Math.max(1, Math.min(quantity, i.stock));
              return { ...i, quantity: validQuantity };
            }
            return i;
          })
        }));
      },

      toggleSelectItem: (variant_id) => {
        set((state) => ({
          selectedItemIds: state.selectedItemIds.includes(variant_id)
            ? state.selectedItemIds.filter(id => id !== variant_id)
            : [...state.selectedItemIds, variant_id]
        }));
      },

      toggleSelectGroup: (product_id, isSelected) => {
        set((state) => {
          // Find all variant IDs for this product
          const groupVariantIds = state.items
            .filter(i => i.product_id === product_id)
            .map(i => i.variant_id);
            
          let newSelected = [...state.selectedItemIds];
          if (isSelected) {
            // Add all variant IDs that aren't already selected
            groupVariantIds.forEach(id => {
              if (!newSelected.includes(id)) {
                newSelected.push(id);
              }
            });
          } else {
            // Remove all variant IDs for this product
            newSelected = newSelected.filter(id => !groupVariantIds.includes(id));
          }
          
          return { selectedItemIds: newSelected };
        });
      },

      toggleSelectAll: () => {
        set((state) => {
          const allSelected = state.selectedItemIds.length === state.items.length && state.items.length > 0;
          return {
            selectedItemIds: allSelected ? [] : state.items.map(i => i.variant_id)
          };
        });
      },

      getSelectedItems: () => {
        const { items, selectedItemIds } = get();
        return items.filter(i => selectedItemIds.includes(i.variant_id));
      },

      removeSelectedItems: () => {
        set((state) => ({
          items: state.items.filter(i => !state.selectedItemIds.includes(i.variant_id)),
          selectedItemIds: []
        }));
      },

      clearCart: () => set({ items: [], selectedItemIds: [] }),

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getSelectedTotalPrice: () => {
        return get().getSelectedItems().reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      }
    }),
    {
      name: 'cart-storage',
    }
  )
);
