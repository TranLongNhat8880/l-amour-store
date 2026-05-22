import { useState, useEffect } from "react";
import axiosClient from "../../../api/axiosClient";
import { formatPrice } from "../../data";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res: any = await axiosClient.get("/admin/dashboard");
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="text-center py-20 text-stone-500 italic">Đang tải dữ liệu...</div>;
  }

  const kpis = [
    { label: "Doanh thu", value: formatPrice(stats?.kpis?.total_revenue || 0), trend: "Hoàn tất" },
    { label: "Đơn hàng hợp lệ", value: stats?.kpis?.total_orders || 0, trend: "Trừ đơn hủy" },
    { label: "Sản phẩm", value: stats?.kpis?.total_products || 0, trend: "Đang bán" },
    { label: "Khách hàng", value: stats?.kpis?.total_users || 0, trend: "Thành viên" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-sm shadow-sm border border-stone-100">
            <p className="text-sm text-stone-500 uppercase tracking-wider">{stat.label}</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-2xl font-bold text-stone-900">{stat.value}</h3>
              <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-1 rounded-full uppercase">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white p-8 rounded-sm shadow-sm border border-stone-100">
        <h3 className="text-lg font-bold text-stone-900 mb-6 font-serif">Doanh thu 12 tháng qua</h3>
        <div className="h-96 w-full">
          {stats?.chart?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chart} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis dataKey="month" stroke="#a8a29e" fontSize={12} tickMargin={10} />
                <YAxis 
                  stroke="#a8a29e" 
                  fontSize={12} 
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                    return value;
                  }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatPrice(value), 'Doanh thu']}
                  labelFormatter={(label) => `Tháng: ${label}`}
                  contentStyle={{ borderRadius: '4px', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#9f1239" 
                  strokeWidth={3}
                  activeDot={{ r: 8, fill: "#9f1239" }} 
                  dot={{ r: 4, fill: "#fff", stroke: "#9f1239", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-stone-400 italic">
               Chưa có dữ liệu doanh thu
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
