import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { formatPrice } from "../data";
import { Shield, Lock, Trash2, MapPin, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import axiosClient from "../../api/axiosClient";
import { toast } from "sonner";
import { AddressSelector } from "../components/AddressSelector";
import { useOrderSuccessStore } from "../../store/orderSuccessStore";

interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  is_default: boolean | number;
}

export function Checkout() {
  const navigate = useNavigate();
  const { getSelectedItems, removeSelectedItems, getSelectedTotalPrice, removeFromCart } = useCartStore();
  const { user } = useAuthStore();
  const setOrderSuccess = useOrderSuccessStore(state => state.setOrder);
  
  const cartItems = getSelectedItems();
  const subtotal = getSelectedTotalPrice();
  
  const [isDiscreetShipping, setIsDiscreetShipping] = useState(true);
  const [voucher, setVoucher] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Address book state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [userVouchers, setUserVouchers] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [addressMode, setAddressMode] = useState<'old' | 'new'>('new');
  const [newAddress, setNewAddress] = useState({ full_name: user?.full_name || "", phone: user?.phone || "", street: "", ward: "", district: "", province: "" });

  const shippingCost = 35000;
  const total = subtotal + shippingCost - discount;

  useEffect(() => {
    // Redirect if no items selected
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }
    
    fetchAddresses();
    if (user) {
      fetchUserVouchers();
    }
  }, [user, cartItems.length, navigate]);

  const fetchUserVouchers = async () => {
    try {
      const res: any = await axiosClient.get("/vouchers/my-vouchers");
      setUserVouchers(res.data);
    } catch (err) {
      console.error("Failed to fetch user vouchers", err);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res: any = await axiosClient.get("/user/addresses");
      setAddresses(res.data);
      // Auto-select default address
      const def = res.data.find((a: Address) => a.is_default);
      if (def) setSelectedAddressId(def.id);
      else if (res.data.length > 0) setSelectedAddressId(res.data[0].id);
      // If no addresses, show the add form
      if (res.data.length === 0) setIsAddingNew(true);
    } catch {
      // User has no addresses, show add form
      setIsAddingNew(true);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.full_name || !newAddress.phone || !newAddress.street || !newAddress.ward || !newAddress.province || (addressMode === 'old' && !newAddress.district)) {
      toast.error("Vui lòng điền đầy đủ thông tin địa chỉ");
      return;
    }
    try {
      const addressPayload = {
        full_name: newAddress.full_name,
        phone: newAddress.phone,
        address_line: newAddress.street,
        city: addressMode === 'new' 
          ? `${newAddress.ward}, ${newAddress.province}`
          : `${newAddress.ward}, ${newAddress.district}, ${newAddress.province}`,
        is_default: addresses.length === 0
      };
      await axiosClient.post("/user/addresses", addressPayload);
      toast.success("Đã thêm địa chỉ mới!");
      setIsAddingNew(false);
      setNewAddress({ full_name: user?.full_name || "", phone: user?.phone || "", street: "", ward: "", district: "", province: "" });
      fetchAddresses();
    } catch {
      toast.error("Không thể thêm địa chỉ");
    }
  };

  const handleApplyVoucher = async (codeToApply: string) => {
    if (!codeToApply) return;
    try {
      const res: any = await axiosClient.post("/vouchers/validate", { 
        code: codeToApply,
        total_amount: subtotal
      });
      setDiscount(res.data.discount_amount);
      toast.success(`Áp dụng mã giảm giá thành công: -${formatPrice(res.data.discount_amount)}`);
    } catch (error: any) {
      setDiscount(0);
      toast.error(error.message || "Mã giảm giá không hợp lệ");
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    if (!selectedAddress) {
      toast.error("Vui lòng chọn hoặc thêm địa chỉ giao hàng");
      return;
    }

    setIsLoading(true);
    try {
      const items = cartItems.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity
      }));

      const res: any = await axiosClient.post("/orders/checkout", {
        items,
        voucher_code: discount > 0 ? voucher : null,
        is_discreet_shipping: isDiscreetShipping,
        shipping_info: {
          email: user?.email,
          full_name: selectedAddress.full_name,
          phone: selectedAddress.phone,
          address_line: selectedAddress.address_line,
          city: selectedAddress.city,
        }
      });

      // Save order data to store for the success page
      setOrderSuccess({
        orderId: res.data?.order_id || res.data?.id || "—",
        items: cartItems,
        shippingAddress: {
          full_name: selectedAddress.full_name,
          phone: selectedAddress.phone,
          address_line: selectedAddress.address_line,
          city: selectedAddress.city,
        },
        isDiscreet: isDiscreetShipping,
        total: total,
      });

      toast.success("Đặt hàng thành công!");
      removeSelectedItems();
      navigate("/order-success");
    } catch (error: any) {
      toast.error(error.message || "Đặt hàng thất bại, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-serif text-stone-900 mb-4">Giỏ hàng của bạn đang trống</h2>
        <p className="text-stone-500 mb-8">Hãy chọn cho mình những món đồ quyến rũ nhất nhé.</p>
        <Link to="/shop" className="inline-flex items-center px-8 py-3 bg-rose-800 text-white font-medium uppercase tracking-wider text-sm hover:bg-rose-700 transition-colors rounded-sm">
          Tiếp Tục Mua Sắm
        </Link>
      </div>
    );
  }

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  return (
    <div className="bg-stone-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex flex-col lg:flex-row gap-10">
        {/* Left Col: Checkout Form */}
        <div className="flex-1">
          <h1 className="text-3xl font-serif text-stone-900 mb-8">Thanh Toán</h1>
          
          <form id="checkout-form" onSubmit={handleCheckout} className="space-y-8">
            {/* Address Selection */}
            <section className="bg-white p-6 rounded-sm shadow-sm border border-stone-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium text-stone-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-700" />
                  1. Địa chỉ giao hàng
                </h2>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(!isAddingNew)}
                  className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 uppercase tracking-wider"
                >
                  <Plus className="w-3 h-3" /> Thêm địa chỉ mới
                </button>
              </div>

              {/* No address warning */}
              {addresses.length === 0 && !isAddingNew && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-sm text-amber-800 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  Bạn chưa có địa chỉ giao hàng. Vui lòng thêm ít nhất một địa chỉ để tiếp tục.
                </div>
              )}

              {/* Existing Addresses */}
              {addresses.length > 0 && (
                <div className="space-y-3 mb-4">
                  {addresses.map(addr => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-4 p-4 border rounded-sm cursor-pointer transition-all ${
                        selectedAddressId === addr.id
                          ? 'border-rose-500 bg-rose-50/50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 w-4 h-4 text-rose-700 border-stone-300 focus:ring-rose-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-stone-900">{addr.full_name}</p>
                          <p className="text-sm text-stone-500">| {addr.phone}</p>
                          {addr.is_default && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Mặc định</span>
                          )}
                        </div>
                        <p className="text-sm text-stone-600 mt-1">{addr.address_line}, {addr.city}</p>
                      </div>
                      {selectedAddressId === addr.id && (
                        <CheckCircle2 className="w-5 h-5 text-rose-600 shrink-0" />
                      )}
                    </label>
                  ))}
                </div>
              )}

              {/* Add New Address Form */}
              {isAddingNew && (
                <div className="border border-dashed border-stone-300 rounded-sm p-4 space-y-3 mt-2 bg-stone-50">
                  <p className="text-sm font-bold text-stone-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-rose-700" /> Thêm địa chỉ mới
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-stone-500 font-medium mb-1 block">Họ và Tên *</label>
                      <input
                        type="text"
                        value={newAddress.full_name}
                        onChange={e => setNewAddress({...newAddress, full_name: e.target.value})}
                        className="w-full border border-stone-200 px-3 py-2 rounded-sm text-sm focus:outline-none focus:border-rose-500"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500 font-medium mb-1 block">Số điện thoại *</label>
                      <input
                        type="tel"
                        value={newAddress.phone}
                        onChange={e => setNewAddress({...newAddress, phone: e.target.value})}
                        className="w-full border border-stone-200 px-3 py-2 rounded-sm text-sm focus:outline-none focus:border-rose-500"
                        placeholder="09xx xxx xxx"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-stone-500 font-medium mb-1 block">Hệ thống hành chính *</label>
                      <div className="flex gap-4 items-center">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input 
                            type="radio" 
                            name="checkout_address_mode"
                            value="new"
                            checked={addressMode === 'new'}
                            onChange={() => setAddressMode('new')}
                            className="accent-rose-500"
                          />
                          Mới (34 Tỉnh/Thành)
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input 
                            type="radio" 
                            name="checkout_address_mode"
                            value="old"
                            checked={addressMode === 'old'}
                            onChange={() => setAddressMode('old')}
                            className="accent-rose-500"
                          />
                          Cũ (63 Tỉnh/Thành)
                        </label>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-stone-500 font-medium mb-1 block">Khu vực giao hàng *</label>
                      <AddressSelector 
                        mode={addressMode}
                        initialProvince={newAddress.province}
                        initialDistrict={newAddress.district}
                        initialWard={newAddress.ward}
                        onChange={(p, d, w) => setNewAddress(prev => ({...prev, province: p, district: d, ward: w}))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-stone-500 font-medium mb-1 block">Địa chỉ cụ thể (Số nhà, đường...) *</label>
                      <input
                        type="text"
                        value={newAddress.street}
                        onChange={e => setNewAddress({...newAddress, street: e.target.value})}
                        className="w-full border border-stone-200 px-3 py-2 rounded-sm text-sm focus:outline-none focus:border-rose-500"
                        placeholder="Ví dụ: Số 123 Đường Lê Lợi"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleAddAddress}
                      className="flex-1 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest py-2.5 rounded-sm hover:bg-stone-800 transition-colors"
                    >
                      Lưu địa chỉ này
                    </button>
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsAddingNew(false)}
                        className="px-4 py-2.5 border border-stone-200 text-stone-600 text-xs font-medium rounded-sm hover:bg-stone-50"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Discreet Shipping Toggle */}
              <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-sm">
                <label className="flex items-start cursor-pointer group">
                  <div className="flex items-center h-5">
                    <input 
                      type="checkbox" 
                      checked={isDiscreetShipping}
                      onChange={(e) => setIsDiscreetShipping(e.target.checked)}
                      className="w-5 h-5 text-rose-700 border-rose-300 rounded focus:ring-rose-600 focus:ring-2 bg-white"
                    />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-semibold text-rose-900 flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Giao hàng kín đáo (Discreet Shipping)
                    </div>
                    <p className="text-sm text-rose-800/80 mt-1">
                      Các mặt hàng nhạy cảm sẽ được ghi tên là "Phụ kiện thời trang" trên vận đơn.
                    </p>
                  </div>
                </label>
              </div>
            </section>

            {/* Payment Method */}
            <section className="bg-white p-6 rounded-sm shadow-sm border border-stone-100">
              <h2 className="text-xl font-medium text-stone-900 mb-4">2. Phương thức thanh toán</h2>
              <div className="border border-stone-200 rounded-sm p-4 flex items-center bg-stone-50 cursor-pointer">
                <input type="radio" checked readOnly className="w-4 h-4 text-rose-700 border-stone-300" />
                <span className="ml-3 font-medium text-stone-700">Thanh toán khi nhận hàng (COD)</span>
                <span className="ml-auto text-sm text-stone-500">Trả tiền khi nhận hàng</span>
              </div>
            </section>
          </form>
        </div>

        {/* Right Col: Order Summary */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="bg-white p-6 rounded-sm shadow-sm border border-stone-100 sticky top-28">
            <h2 className="text-xl font-medium text-stone-900 mb-6">Tóm tắt đơn hàng</h2>
            
            {/* Selected Address Summary */}
            {selectedAddress && (
              <div className="mb-4 p-3 bg-stone-50 border border-stone-200 rounded-sm">
                <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Giao đến</p>
                <p className="text-sm font-bold text-stone-900">{selectedAddress.full_name} | {selectedAddress.phone}</p>
                <p className="text-xs text-stone-500 mt-0.5">{selectedAddress.address_line}, {selectedAddress.city}</p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              {cartItems.map(item => (
                <div key={item.variant_id} className="flex gap-4 items-start">
                  <div className="relative w-16 h-20 bg-stone-100 shrink-0">
                    <img src={item.image_url || "https://images.unsplash.com/photo-1668191219162-b58465065deb?w=200&q=80"} alt={item.name} className="w-full h-full object-cover" />
                    <span className="absolute -top-2 -right-2 bg-stone-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-stone-900 leading-tight">{item.name}</h3>
                    <p className="text-xs text-stone-500 mt-1">{item.color} / {item.size}</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-rose-800 font-medium">{formatPrice(item.price)}</p>
                      <button onClick={() => removeFromCart(item.variant_id)} className="text-stone-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-100 pt-4 mb-4">
              {/* User Voucher Warehouse */}
              {userVouchers.length > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-3 font-bold">Kho Voucher của bạn</p>
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                    {userVouchers.map(v => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setVoucher(v.code);
                          handleApplyVoucher(v.code);
                        }}
                        className={`text-left p-3 border rounded-sm transition-all flex justify-between items-center group ${
                          voucher === v.code 
                            ? 'border-rose-500 bg-rose-50' 
                            : 'border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-stone-900 group-hover:text-rose-700">{v.code}</p>
                          <p className="text-[10px] text-stone-500">Giảm {v.discount_type === 'percent' ? `${v.discount_value}%` : formatPrice(v.discount_value)}</p>
                        </div>
                        {voucher === v.code && <CheckCircle2 className="w-4 h-4 text-rose-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-3 font-bold">Nhập mã khác</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Mã giảm giá" 
                  value={voucher}
                  onChange={(e) => setVoucher(e.target.value)}
                  className="flex-1 border border-stone-300 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-rose-500"
                />
                <button 
                  onClick={() => handleApplyVoucher(voucher)} 
                  className="bg-stone-900 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors rounded-sm"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            <div className="border-t border-stone-100 pt-4 space-y-3 mb-6">
              <div className="flex justify-between text-sm text-stone-600">
                <span>Tạm tính</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-stone-600">
                <span>Phí vận chuyển</span>
                <span>{formatPrice(shippingCost)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-medium text-stone-900 pt-3 border-t border-stone-100">
                <span>Tổng cộng</span>
                <span className="text-rose-800">{formatPrice(total)}</span>
              </div>
            </div>

            <button 
              type="submit" 
              form="checkout-form"
              disabled={isLoading || (!selectedAddressId && !isAddingNew)}
              className="w-full bg-rose-800 hover:bg-rose-700 text-white py-4 font-bold uppercase tracking-widest text-sm flex justify-center items-center gap-2 transition-colors rounded-sm disabled:bg-rose-400"
            >
              <Lock className="w-4 h-4" /> {isLoading ? "Đang xử lý..." : "Hoàn tất đặt hàng"}
            </button>
            <p className="text-xs text-center text-stone-500 mt-4 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" /> Thanh toán SSL an toàn
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
