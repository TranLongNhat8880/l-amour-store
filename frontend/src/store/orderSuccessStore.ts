import { create } from "zustand";

interface OrderSuccessData {
  orderId: string;
  items: any[];
  shippingAddress: {
    full_name: string;
    phone: string;
    address_line: string;
    city: string;
  };
  isDiscreet: boolean;
  total: number;
}

interface OrderSuccessStore {
  order: OrderSuccessData | null;
  setOrder: (order: OrderSuccessData) => void;
  clearOrder: () => void;
}

export const useOrderSuccessStore = create<OrderSuccessStore>((set) => ({
  order: null,
  setOrder: (order) => set({ order }),
  clearOrder: () => set({ order: null }),
}));
