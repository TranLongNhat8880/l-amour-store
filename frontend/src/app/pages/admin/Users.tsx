import { useState, useEffect } from "react";
import axiosClient from "../../../api/axiosClient";
import {
  Users as UsersIcon,
  ShieldAlert,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  ShieldPlus,
  ShieldMinus,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "../../components/ConfirmModal";

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  role: "admin" | "user";
  is_active: number | boolean;
  created_at: string;
}

type ModalAction = "toggle_status" | "promote" | "demote" | null;

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Confirm Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalAction, setModalAction] = useState<ModalAction>(null);

  const fetchUsers = async () => {
    try {
      const res: any = await axiosClient.get("/admin/users");
      setUsers(res.data);
    } catch (error) {
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────

  const openModal = (user: User, action: ModalAction) => {
    setSelectedUser(user);
    setModalAction(action);
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedUser || !modalAction) return;
    try {
      if (modalAction === "toggle_status") {
        const res: any = await axiosClient.patch(`/admin/users/${selectedUser.id}/status`);
        toast.success(res.message || "Đã thay đổi trạng thái tài khoản");
      } else {
        const newRole = modalAction === "promote" ? "admin" : "user";
        const res: any = await axiosClient.patch(`/admin/users/${selectedUser.id}/role`, { role: newRole });
        toast.success(res.message || "Đã thay đổi quyền tài khoản");
      }
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Thao tác thất bại");
    } finally {
      setIsConfirmOpen(false);
    }
  };

  // ── Modal config theo action ───────────────────────────────────────────

  const getModalConfig = () => {
    if (!selectedUser) return { title: "", message: "", confirmText: "", type: "info" as const };
    switch (modalAction) {
      case "toggle_status":
        return {
          title: selectedUser.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản",
          message: selectedUser.is_active
            ? `Khách hàng ${selectedUser.full_name} sẽ bị đăng xuất và không thể mua hàng nữa. Bạn chắc chứ?`
            : `Khôi phục quyền truy cập cho ${selectedUser.full_name}?`,
          confirmText: selectedUser.is_active ? "Xác nhận khóa" : "Mở khóa",
          type: selectedUser.is_active ? ("danger" as const) : ("info" as const),
        };
      case "promote":
        return {
          title: "Cấp quyền Admin",
          message: `${selectedUser.full_name} sẽ có toàn quyền quản trị hệ thống. Bạn chắc chứ?`,
          confirmText: "Xác nhận cấp quyền",
          type: "info" as const,
        };
      case "demote":
        return {
          title: "Thu hồi quyền Admin",
          message: `${selectedUser.full_name} sẽ mất toàn bộ quyền quản trị và trở về tài khoản thường.`,
          confirmText: "Xác nhận thu hồi",
          type: "danger" as const,
        };
      default:
        return { title: "", message: "", confirmText: "", type: "info" as const };
    }
  };

  // ── Filter & Pagination ───────────────────────────────────────────────

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm))
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  const modalConfig = getModalConfig();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
          <UsersIcon className="w-5 h-5 text-rose-800" />
          Quản lý Tài khoản
        </h2>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, sđt..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-sm focus:outline-none focus:border-rose-500 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-sm shadow-sm border border-stone-100 overflow-hidden flex flex-col min-h-[500px]">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500">Tài khoản</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500">Thông tin liên hệ</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500">Ngày đăng ký</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500">Quyền</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500">Trạng thái</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-stone-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-stone-400 italic">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-stone-400">
                    Không tìm thấy tài khoản nào.
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-stone-50/50 transition-colors">
                    {/* Tài khoản */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-stone-900">{user.full_name}</p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-tighter">
                        ID: {user.id.substring(0, 8)}
                      </p>
                    </td>

                    {/* Liên hệ */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-stone-700">{user.email}</p>
                      <p className="text-xs text-stone-500">{user.phone || "Chưa cập nhật SĐT"}</p>
                    </td>

                    {/* Ngày đăng ký */}
                    <td className="px-6 py-4 text-sm text-stone-500">
                      {new Date(user.created_at).toLocaleDateString("vi-VN")}
                    </td>

                    {/* Role badge */}
                    <td className="px-6 py-4">
                      {user.role === "admin" ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-1 rounded-full border border-rose-200 w-fit uppercase tracking-wider">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded-full border border-stone-200 w-fit uppercase tracking-wider">
                          <UsersIcon className="w-3 h-3" /> Khách hàng
                        </span>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-100 w-fit uppercase tracking-wider">
                          <ShieldCheck className="w-3 h-3" /> Hoạt động
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-full border border-rose-100 w-fit uppercase tracking-wider">
                          <ShieldAlert className="w-3 h-3" /> Đã khóa
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Promote / Demote */}
                        {user.role === "user" ? (
                          <button
                            onClick={() => openModal(user, "promote")}
                            title="Cấp quyền Admin"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm text-xs font-medium text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
                          >
                            <ShieldPlus className="w-3 h-3" /> Cấp Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => openModal(user, "demote")}
                            title="Thu hồi quyền Admin"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm text-xs font-medium text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-colors"
                          >
                            <ShieldMinus className="w-3 h-3" /> Thu hồi
                          </button>
                        )}

                        {/* Lock / Unlock — chỉ cho user thường */}
                        {user.role !== "admin" && (
                          <button
                            onClick={() => openModal(user, "toggle_status")}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                              user.is_active
                                ? "text-stone-600 hover:bg-stone-100 border border-transparent hover:border-stone-200"
                                : "text-green-700 hover:bg-green-50 border border-transparent hover:border-green-100"
                            }`}
                          >
                            {user.is_active ? (
                              <>
                                <Lock className="w-3 h-3" /> Khóa
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3 h-3" /> Mở khóa
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && totalPages > 1 && (
          <div className="border-t border-stone-100 px-6 py-4 flex items-center justify-between bg-stone-50 mt-auto">
            <p className="text-sm text-stone-500">
              Hiển thị{" "}
              <span className="font-bold text-stone-900">{startIndex + 1}</span> đến{" "}
              <span className="font-bold text-stone-900">
                {Math.min(startIndex + itemsPerPage, filteredUsers.length)}
              </span>{" "}
              trong số{" "}
              <span className="font-bold text-stone-900">{filteredUsers.length}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 border border-stone-200 rounded-sm text-stone-500 hover:bg-white disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 border border-stone-200 rounded-sm text-stone-500 hover:bg-white disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText={modalConfig.confirmText}
        type={modalConfig.type}
      />
    </div>
  );
}
