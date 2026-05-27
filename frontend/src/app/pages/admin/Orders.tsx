import { useState, useEffect } from "react";
import axiosClient from "../../../api/axiosClient";
import { formatPrice } from "../../data";
import { Search, Calendar, CreditCard, ChevronRight, Truck, CheckCircle, XCircle, Clock, X, Package, User, MapPin, Phone, Mail, Shield } from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "../../components/ConfirmModal";
import { initSocket } from "../../../api/socket";
import { useAuthStore } from "../../../store/authStore";

export function AdminOrders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [counts, setCounts] = useState<any>({
    pending: 0,
    preparing: 0,
    shipping: 0
  });
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Confirm Modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'info' | 'success';
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: 'info'
  });

  const fetchOrders = async () => {
    try {
      const res: any = await axiosClient.get(`/orders${filterStatus ? `?status=${filterStatus}` : ''}`);
      setOrders(res.data);
    } catch (error) {
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const res: any = await axiosClient.get("/dashboard/stats");
      setCounts({
        pending: res.data.pending_count,
        preparing: res.data.preparing_count,
        shipping: res.data.shipping_count
      });
    } catch (error) {
      console.error("Failed to fetch order counts", error);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const res: any = await axiosClient.get(`/orders/${orderId}`);
      setSelectedOrder(res.data);
      setIsDetailsModalOpen(true);
    } catch (error) {
      toast.error("Không thể tải chi tiết đơn hàng");
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCounts();
  }, [filterStatus]);

  useEffect(() => {
    if (user) {
      const socket = initSocket(user.id, user.role);
      socket.on("admin_update", () => {
        fetchOrders();
        fetchCounts();
      });
      return () => {
        socket.off("admin_update");
      };
    }
  }, [user]);

  const updateStatus = async (orderId: string, status: string) => {
    setIsUpdating(true);
    try {
      await axiosClient.patch(`/orders/${orderId}/status`, { status });
      toast.success("Đã cập nhật trạng thái đơn hàng");
      fetchOrders();
      fetchCounts();
      if (selectedOrder && selectedOrder.id === orderId) {
        fetchOrderDetails(orderId);
      }
    } catch (error: any) {
      toast.error(error.message || "Cập nhật thất bại");
    } finally {
      setIsUpdating(false);
      setConfirmConfig(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleUpdateClick = (orderId: string, status: string) => {
    let title = "";
    let message = "";
    let type: 'danger' | 'info' | 'success' = 'info';

    switch (status) {
      case 'preparing':
        title = "Xác nhận đơn hàng";
        message = "Bạn có chắc chắn muốn xác nhận đơn hàng này và chuyển sang giai đoạn xử lý?";
        type = 'info';
        break;
      case 'shipping':
        title = "Bắt đầu giao hàng";
        message = "Xác nhận đơn hàng đã được bàn giao cho đơn vị vận chuyển?";
        type = 'info';
        break;
      case 'completed':
        title = "Hoàn thành đơn hàng";
        message = "Xác nhận khách hàng đã nhận được hàng và hoàn tất đơn hàng?";
        type = 'success';
        break;
      case 'cancelled':
        title = "Hủy đơn hàng";
        message = "Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.";
        type = 'danger';
        break;
    }

    setConfirmConfig({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => updateStatus(orderId, status)
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipping': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'preparing': return 'Đang xử lý';
      case 'shipping': return 'Đang giao hàng';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const tabs = [
    { id: "", label: "Tất cả" },
    { id: "pending", label: "Chờ xác nhận", count: counts.pending },
    { id: "preparing", label: "Đang xử lý", count: counts.preparing },
    { id: "shipping", label: "Đang giao", count: counts.shipping },
    { id: "completed", label: "Hoàn thành" },
    { id: "cancelled", label: "Đã hủy" },
  ];

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex bg-white border border-stone-200 rounded-sm p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-colors relative flex items-center gap-2 ${
                filterStatus === tab.id ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-900"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${filterStatus === tab.id ? "bg-white text-stone-900 shadow-sm" : "bg-rose-600 text-white shadow-sm shadow-rose-200"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-sm shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500">Mã đơn & Ngày đặt</th>
              <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500">Khách hàng</th>
              <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500">Tổng tiền</th>
              <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500">Trạng thái</th>
              <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-stone-400 italic">Đang tải dữ liệu...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-stone-400">Không có đơn hàng nào.</td></tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <button onClick={() => fetchOrderDetails(order.id)} className="text-left group/id">
                      <p className="text-sm font-bold text-stone-900 group-hover/id:text-rose-800 transition-colors">#{order.id.substring(0, 8)}</p>
                      <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-1">
                        <Calendar className="w-3 h-3" /> {new Date(order.created_at).toLocaleString('vi-VN')}
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-stone-800">{order.shipping_full_name || order.full_name}</p>
                    <p className="text-xs text-stone-500">{order.shipping_phone || order.email}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-rose-900">
                    {formatPrice(order.total_amount)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        {order.status === 'pending' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleUpdateClick(order.id, 'preparing'); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-800 text-[10px] font-bold rounded-sm border border-rose-200 hover:bg-rose-100 transition-all uppercase tracking-wider"
                          >
                            <Clock className="w-3.5 h-3.5" /> Xác nhận
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleUpdateClick(order.id, 'shipping'); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-sm border border-indigo-100 hover:bg-indigo-100 transition-all uppercase tracking-wider"
                          >
                            <Truck className="w-3.5 h-3.5" /> Giao hàng
                          </button>
                        )}
                        {order.status === 'shipping' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleUpdateClick(order.id, 'completed'); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-sm border border-green-100 hover:bg-green-100 transition-all uppercase tracking-wider"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Hoàn thành
                          </button>
                        )}
                        
                        <button onClick={() => fetchOrderDetails(order.id)} className="p-2 text-stone-300 hover:text-stone-900 hover:bg-stone-50 rounded-sm transition-all">
                          <ChevronRight className="w-4.5 h-4.5" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {isDetailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 lg:p-8">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsDetailsModalOpen(false)}></div>
          <div className="bg-white w-full max-w-4xl rounded-sm shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <div>
                <h3 className="text-xl font-serif font-bold text-stone-900 uppercase tracking-widest flex items-center gap-3">
                  Chi tiết đơn hàng <span className="text-rose-800">#{selectedOrder.id.substring(0, 8)}</span>
                </h3>
                <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest">Ngày đặt: {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}</p>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-stone-400 hover:text-stone-600 transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Customer Info */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <User className="w-3 h-3 text-rose-800" /> Khách hàng
                  </h4>
                  <div className="text-sm space-y-1.5">
                    <p className="font-bold text-stone-900">{selectedOrder.shipping_full_name || "N/A"}</p>
                    <p className="text-stone-600 flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {selectedOrder.shipping_phone}</p>
                    <p className="text-stone-600 flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {selectedOrder.shipping_email}</p>
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-rose-800" /> Địa chỉ giao hàng
                  </h4>
                  <div className="text-sm space-y-1.5">
                    <p className="text-stone-800 leading-relaxed">
                      {selectedOrder.shipping_address_line}<br />
                      {selectedOrder.shipping_district ? `${selectedOrder.shipping_district}, ` : ""}{selectedOrder.shipping_city}
                    </p>
                    {selectedOrder.is_discreet_shipping === 1 && (
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-sm uppercase tracking-wider mt-2 border border-rose-100">
                        <Shield className="w-3 h-3" /> Giao hàng kín đáo
                      </div>
                    )}
                  </div>
                </div>

                {/* Status & Payment */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Clock className="w-3 h-3 text-rose-800" /> Trạng thái & Thanh toán
                  </h4>
                  <div className="space-y-3">
                     <span className={`inline-block text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                     </span>
                     <p className="text-sm font-medium text-stone-600">Thanh toán: <span className="font-bold text-stone-900 uppercase">COD</span></p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-stone-100 rounded-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100">
                      <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-stone-500">Sản phẩm</th>
                      <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-stone-500 text-center">Số lượng</th>
                      <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-stone-500 text-right">Đơn giá</th>
                      <th className="px-6 py-3 text-[10px] uppercase tracking-widest font-bold text-stone-500 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50 text-sm">
                    {selectedOrder.items?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-stone-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-12 bg-stone-100 rounded-sm overflow-hidden border border-stone-100 shadow-sm">
                              <img src={item.variant_image || item.thumbnail_url} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-bold text-stone-900 leading-tight">{item.product_name}</p>
                              <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-0.5">{item.size} / {item.color}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-stone-600">{item.quantity}</td>
                        <td className="px-6 py-4 text-right text-stone-600">{formatPrice(item.unit_price)}</td>
                        <td className="px-6 py-4 text-right font-bold text-stone-900">{formatPrice(item.unit_price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-stone-50/50">
                      <td colSpan={3} className="px-6 py-4 text-right text-stone-500 font-medium">Tạm tính:</td>
                      <td className="px-6 py-4 text-right font-medium text-stone-900">{formatPrice(selectedOrder.items?.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0))}</td>
                    </tr>
                    {selectedOrder.voucher_code && (
                      <tr className="bg-stone-50/50 border-t border-stone-100">
                        <td colSpan={3} className="px-6 py-3 text-right text-green-600 font-medium">Voucher ({selectedOrder.voucher_code}):</td>
                        <td className="px-6 py-3 text-right font-bold text-green-600">-{formatPrice(selectedOrder.total_amount < selectedOrder.items?.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0) ? (selectedOrder.items?.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0) - selectedOrder.total_amount) : 0)}</td>
                      </tr>
                    )}
                    <tr className="bg-stone-100/50 border-t border-stone-200">
                      <td colSpan={3} className="px-6 py-5 text-right font-bold text-stone-900 uppercase tracking-widest text-xs">Tổng cộng:</td>
                      <td className="px-6 py-5 text-right font-black text-rose-900 text-xl">{formatPrice(selectedOrder.total_amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="px-8 py-6 border-t border-stone-100 bg-stone-50 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2">
                 {selectedOrder.status === 'pending' && (
                    <button onClick={() => handleUpdateClick(selectedOrder.id, 'preparing')} disabled={isUpdating} className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-blue-700 transition-colors shadow-lg">Xác nhận đơn</button>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <button onClick={() => handleUpdateClick(selectedOrder.id, 'shipping')} disabled={isUpdating} className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-indigo-700 transition-colors shadow-lg">Giao hàng</button>
                  )}
                  {selectedOrder.status === 'shipping' && (
                    <button onClick={() => handleUpdateClick(selectedOrder.id, 'completed')} disabled={isUpdating} className="px-6 py-2.5 bg-green-600 text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-green-700 transition-colors shadow-lg">Hoàn thành</button>
                  )}
                  {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
                    <button onClick={() => handleUpdateClick(selectedOrder.id, 'cancelled')} disabled={isUpdating} className="px-6 py-2.5 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-rose-50 transition-colors">Hủy đơn</button>
                  )}
               </div>
               <button onClick={() => window.print()} className="px-6 py-2.5 border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-white transition-colors">In phiếu giao hàng</button>
            </div>
          </div>
        </div>
      )}
      
      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        type={confirmConfig.type}
        confirmText="Xác nhận"
        cancelText="Quay lại"
      />
    </div>
  );
}
