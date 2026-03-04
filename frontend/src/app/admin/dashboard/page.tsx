"use client";
import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Eye, ExternalLink } from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Order {
    id: string;
    customer_id: string | null;
    customer_name: string | null; // Added
    material_id: string;
    material_name: string | null; // Added
    width_m: number;
    height_m: number;
    total_sqm: number;
    file_url: string | null;
    slip_url: string | null;
    estimated_price: number;
    status: string;
    created_at: string;
    updated_at: string;
}

export default function DashboardPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [activeTab, setActiveTab] = useState<"active" | "history" | "all">("active");

    const fetchOrders = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            // Fetch Orders
            const ordersRes = await fetch(`${API_BASE_URL}/api/orders", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (ordersRes.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/login";
                return;
            }

            if (!ordersRes.ok) throw new Error("Failed to fetch orders");
            const ordersData = await ordersRes.json();
            setOrders(ordersData);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) {
                throw new Error("Failed to update status");
            }

            // Update local state to reflect change instantly
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDownload = async (orderId: string) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/download`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to get download link");
            }

            const { download_url } = await res.json();
            // Open the signed download link in a new tab - S3 will force attachment
            window.location.href = download_url;
        } catch (err: any) {
            alert(err.message);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Pending_Payment":
                return <Badge variant="secondary">รอชำระเงิน</Badge>;
            case "Payment_Checking":
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">รอตรวจสอบชำระเงิน</Badge>;
            case "Producing":
                return <Badge variant="default" className="bg-blue-600">กำลังผลิต</Badge>;
            case "Completed":
                return <Badge variant="default" className="bg-green-600">เสร็จสมบูรณ์</Badge>;
            case "Delivered":
                return <Badge variant="outline" className="text-gray-600 border-gray-600">จัดส่งแล้ว</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };


    return (
        <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-black text-slate-800">จัดการคำสั่งซื้อ (Orders)</CardTitle>
                    <CardDescription>
                        ตรวจสอบและอัปเดตสถานะออเดอร์ของลูกค้า
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchOrders} disabled={isLoading} className="rounded-xl">
                        <RefreshCcw className={`h-4 w-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
                        {error}
                    </div>
                )}

                <div className="flex bg-gray-100 p-1 rounded-lg w-fit mb-6">
                    <button
                        onClick={() => setActiveTab("active")}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "active" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        รายการที่ต้องทำ
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "history" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        ประวัติออเดอร์
                    </button>
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "all" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        ทั้งหมด
                    </button>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>รหัส/วันที่</TableHead>
                                <TableHead>ลูกค้า</TableHead>
                                <TableHead>วัสดุ/ขนาด</TableHead>
                                <TableHead className="text-right">ราคา</TableHead>
                                <TableHead>สถานะ</TableHead>
                                <TableHead className="text-right">จัดการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        กำลังโหลดข้อมูล...
                                    </TableCell>
                                </TableRow>
                            ) : orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-gray-500">
                                        ยังไม่มีรายการคำสั่งซื้อ
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders
                                    .filter(order => {
                                        if (activeTab === "all") return true;
                                        const isHistory = order.status === "Completed" || order.status === "Delivered";
                                        return activeTab === "history" ? isHistory : !isHistory;
                                    })
                                    .map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="py-3">
                                                <div className="font-bold text-xs">{order.id.split('-')[0]}</div>
                                                <div className="text-[10px] text-gray-400">
                                                    {order.created_at ? format(new Date(order.created_at), "dd/MM/yy HH:mm") : "-"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm font-medium">
                                                {order.customer_name || "ลูกค้าทั่วไป"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs font-semibold">{order.material_name || "ไม่ระบุ"}</div>
                                                <div className="text-[10px] text-gray-500">{order.width_m}x{order.height_m}ม.</div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-sm">
                                                ฿{order.estimated_price.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(order.status)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {order.status === "Payment_Checking" && (
                                                        <Button
                                                            size="sm"
                                                            className="h-8 bg-green-600 hover:bg-green-700 text-[10px]"
                                                            onClick={() => updateOrderStatus(order.id, "Producing")}
                                                        >
                                                            ยืนยันยอด
                                                        </Button>
                                                    )}
                                                    {order.status === "Producing" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 border-blue-600 text-blue-600 hover:bg-blue-50 text-[10px]"
                                                            onClick={() => updateOrderStatus(order.id, "Completed")}
                                                        >
                                                            ผลิตเสร็จ
                                                        </Button>
                                                    )}
                                                    {order.file_url && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 text-blue-600 hover:bg-blue-50 p-2"
                                                            title="ดาวน์โหลดไฟล์งาน"
                                                            onClick={() => handleDownload(order.id)}
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                ดูข้อมูล
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-[425px]">
                                                            <DialogHeader>
                                                                <DialogTitle>รายละเอียดคำสั่งซื้อ</DialogTitle>
                                                                <DialogDescription>
                                                                    รหัส: {selectedOrder?.id}
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="grid gap-4 py-4">
                                                                <div className="grid grid-cols-4 items-center gap-4">
                                                                    <Label className="text-right text-gray-500">วันที่</Label>
                                                                    <span className="col-span-3 text-sm">
                                                                        {selectedOrder?.created_at ? format(new Date(selectedOrder.created_at), "dd/MM/yyyy HH:mm") : "-"}
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-4 items-center gap-4">
                                                                    <Label className="text-right text-gray-500">ขนาด</Label>
                                                                    <span className="col-span-3 font-medium">
                                                                        {selectedOrder?.width_m} x {selectedOrder?.height_m} เมตร ({selectedOrder?.total_sqm.toFixed(2)} ตร.ม.)
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-4 items-center gap-4">
                                                                    <Label className="text-right text-gray-500">ราคา</Label>
                                                                    <span className="col-span-3 font-bold text-lg text-green-600">
                                                                        ฿{selectedOrder?.estimated_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-4 items-center gap-4">
                                                                    <Label className="text-right text-gray-500">ไฟล์งาน</Label>
                                                                    <div className="col-span-3 flex items-center gap-2">
                                                                        {selectedOrder?.file_url ? (
                                                                            <>
                                                                                <a href={selectedOrder.file_url} target="_blank" rel="noreferrer" className="text-sm text-blue-500 underline inline-flex items-center">
                                                                                    เปิดดูไฟล์ <ExternalLink className="ml-1 w-3 h-3" />
                                                                                </a>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    className="h-7 text-[10px]"
                                                                                    onClick={() => handleDownload(selectedOrder.id)}
                                                                                >
                                                                                    ดาวน์โหลด
                                                                                </Button>
                                                                            </>
                                                                        ) : <span className="text-sm text-gray-400">ยังไม่ได้อัปโหลด</span>}
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-4 items-center gap-4">
                                                                    <Label className="text-right text-gray-500">สลิปโอนเงิน</Label>
                                                                    <span className="col-span-3 text-sm text-green-600 break-all">
                                                                        {selectedOrder?.slip_url ? (
                                                                            <a href={selectedOrder.slip_url} target="_blank" rel="noreferrer" className="underline inline-flex items-center">
                                                                                ดูสลิป <ExternalLink className="ml-1 w-3 h-3" />
                                                                            </a>
                                                                        ) : <span className="text-gray-400">ยังไม่ได้อัปโหลด</span>}
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-4 items-center gap-4 mt-2 pt-4 border-t">
                                                                    <Label className="text-right text-gray-500">สถานะ</Label>
                                                                    <div className="col-span-3">
                                                                        <Select
                                                                            value={selectedOrder?.status}
                                                                            onValueChange={(val) => selectedOrder && updateOrderStatus(selectedOrder.id, val)}
                                                                        >
                                                                            <SelectTrigger className="w-full">
                                                                                <SelectValue placeholder="เลือกสถานะ" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="Pending_Payment">รอชำระเงิน</SelectItem>
                                                                                <SelectItem value="Payment_Checking">รอตรวจสอบชำระเงิน</SelectItem>
                                                                                <SelectItem value="Producing">กำลังผลิต</SelectItem>
                                                                                <SelectItem value="Completed">เสร็จสมบูรณ์</SelectItem>
                                                                                <SelectItem value="Delivered">จัดส่งแล้ว</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}