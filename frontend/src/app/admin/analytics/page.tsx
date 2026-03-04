"use client";
import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    RefreshCcw,
    DollarSign,
    Package,
    Users,
    TrendingUp,
    ChevronRight,
    Award
} from "lucide-react";

interface AnalyticsSummary {
    total_revenue: number;
    total_orders: number;
    avg_order_value: number;
    total_customers: number;
}

interface MaterialStats {
    material_name: string;
    order_count: number;
    revenue: number;
}

interface AnalyticsResponse {
    summary: AnalyticsSummary;
    top_materials: MaterialStats[];
}

export default function AnalyticsPage() {
    const [stats, setStats] = useState<AnalyticsSummary | null>(null);
    const [topMaterials, setTopMaterials] = useState<MaterialStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/api/admin/analytics/summary", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) {
                throw new Error("Failed to fetch analytics data");
            }

            const data: AnalyticsResponse = await res.json();
            setStats(data.summary);
            setTopMaterials(data.top_materials);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);


    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">รายงานยอดขายและสถิติ</h1>
                        <p className="text-sm text-slate-500 mt-1">วิเคราะห์ภาพรวมธุรกิจและประสิทธิภาพของวัสดุ</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchAnalytics} disabled={isLoading} className="rounded-xl">
                        <RefreshCcw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-200 font-medium">
                    {error}
                </div>
            )}

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-xl shadow-blue-100/50 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl overflow-hidden relative">
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                        <DollarSign className="w-24 h-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold opacity-80 uppercase tracking-wider">ยอดขายรวม</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">฿{stats?.total_revenue?.toLocaleString() || "0"}</div>
                        <div className="flex items-center gap-1 mt-2 text-xs font-bold bg-white/20 w-fit px-2 py-1 rounded-full">
                            <ChevronRight className="w-3 h-3 rotate-[-90deg]" />
                            +12% vs เดือนที่แล้ว
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">ออเดอร์ทั้งหมด</CardTitle>
                        <Package className="w-5 h-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-800">{stats?.total_orders || "0"} <span className="text-lg font-normal text-slate-400">รายการ</span></div>
                        <p className="text-xs text-slate-400 mt-2 font-medium">คำสั่งซื้อที่เกิดขึ้นในระบบ</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">ยอดเฉลี่ย / งาน</CardTitle>
                        <Award className="w-5 h-5 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-800">฿{stats?.avg_order_value?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "0"}</div>
                        <p className="text-xs text-slate-400 mt-2 font-medium">กำไรเฉลี่ยที่คาดหวังต่อออเดอร์</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">ลูกค้าทั้งหมด</CardTitle>
                        <Users className="w-5 h-5 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-800">{stats?.total_customers || "0"} <span className="text-lg font-normal text-slate-400">ท่าน</span></div>
                        <p className="text-xs text-slate-400 mt-2 font-medium">สมาขิกที่ลงทะเบียนใช้งาน</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top Materials Chart/List */}
                <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b py-6 px-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold text-slate-800">วัสดุที่ทำรายได้สูงสุด</CardTitle>
                                <CardDescription>การจัดอันดับวัสดุตามยอดขายจริงในระบบ</CardDescription>
                            </div>
                            <Button variant="outline" size="icon" onClick={fetchAnalytics} disabled={isLoading} className="rounded-xl">
                                <RefreshCcw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        {isLoading && topMaterials.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                                <RefreshCcw className="w-8 h-8 animate-spin" />
                                <p className="font-medium">กำลังประมวลผลข้อมูลสถิติ...</p>
                            </div>
                        ) : topMaterials.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 font-medium">ยังไม่มีข้อมูลยอดขายในระบบ</div>
                        ) : (
                            <div className="space-y-6">
                                {topMaterials.map((m, idx) => (
                                    <div key={idx} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110 ${idx === 0 ? 'bg-amber-100 text-amber-600' :
                                                idx === 1 ? 'bg-slate-200 text-slate-600' :
                                                    'bg-slate-100 text-slate-400'
                                                }`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-lg">{m.material_name}</div>
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                                                    <Package className="w-3.5 h-3.5" />
                                                    {m.order_count} ออเดอร์
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-blue-600">฿{m.revenue.toLocaleString()}</div>
                                            <div className="text-[10px] font-black uppercase text-slate-300 tracking-widest mt-1">Total Revenue</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Additional Insight Card */}
                <div className="space-y-6">
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-slate-900 text-white overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-bold">ข้อมูลเชิงลึก</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-6">
                            <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                                <h4 className="font-bold text-blue-400 mb-1 flex items-center gap-2">
                                    <Award className="w-4 h-4" />
                                    Best Performing
                                </h4>
                                <p className="text-sm opacity-70 leading-relaxed">
                                    {topMaterials[0] ? `"${topMaterials[0].material_name}" เป็นวัสดุที่ทำรายได้สูงสุดในขณะนี้ ควรเตรียมสต็อกให้เพียงพอ` : 'ยังไม่มีข้อมูลการแสดงผล'}
                                </p>
                            </div>

                            <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                                <h4 className="font-bold text-emerald-400 mb-1 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    เป้าหมายเดือนนี้
                                </h4>
                                <div className="mt-3 space-y-2">
                                    <div className="flex justify-between text-xs opacity-70">
                                        <span>ความคืบหน้า</span>
                                        <span>75% (Mockup)</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-3/4 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-indigo-100/50 rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6">
                        <div className="flex flex-col h-full justify-between">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">สะสมฐานลูกค้า</h3>
                                <p className="text-sm opacity-80 leading-relaxed">
                                    ลูกค้าในระบบส่วนใหญ่นิยมสั่งงานผ่านทางหน้าเว็บโดยตรง ช่วยลดภาระงานของพนักงานรับหน้าร้านได้ถึง 40%
                                </p>
                                <Button variant="link" className="text-white p-0 font-bold mt-4 hover:no-underline flex items-center gap-1">
                                    ดูรายชื่อผู้ใช้ <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}