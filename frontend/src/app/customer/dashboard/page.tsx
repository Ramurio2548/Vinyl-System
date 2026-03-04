"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCcw, ExternalLink, CopyPlus, UploadCloud } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Order {
    id: string;
    customer_id: string;
    material_id: string;
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

export default function CustomerDashboardPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"All" | "Pending" | "Production" | "Finished">("All");

    // Slip Upload State
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadOrderId, setUploadOrderId] = useState<string | null>(null);
    const [slipFile, setSlipFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Print File Upload State
    const [isPrintFileUploadOpen, setIsPrintFileUploadOpen] = useState(false);
    const [printFileUploadOrderId, setPrintFileUploadOrderId] = useState<string | null>(null);
    const [printFile, setPrintFile] = useState<File | null>(null);
    const [isPrintFileUploading, setIsPrintFileUploading] = useState(false);

    const fetchOrders = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                window.location.href = "/login";
                return;
            }

            const res = await fetch("http://localhost:3001/api/customer/orders", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/login";
                return;
            }

            if (!res.ok) {
                throw new Error("เกิดข้อผิดพลาดในการโหลดข้อมูลคำสั่งซื้อ");
            }
            const data = await res.json();
            setOrders(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredOrders = orders.filter((order) => {
        if (activeTab === "All") return true;
        if (activeTab === "Pending") return order.status === "Pending_Payment";
        if (activeTab === "Production") return order.status === "Payment_Checking" || order.status === "Producing";
        if (activeTab === "Finished") return order.status === "Completed" || order.status === "Delivered";
        return true;
    });

    const handleReorder = async (orderId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                window.location.href = "/login";
                return;
            }

            const res = await fetch(`http://localhost:3001/api/orders/${orderId}/reorder`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "เกิดข้อผิดพลาดในการสั่งทำซ้ำ");
            }

            alert(`สั่งซื้อสำเร็จ! รหัสอ้างอิงใหม่: ${data.order_id.split('-')[0]}`);
            fetchOrders(); // Refresh table
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    const handleUploadSlip = async () => {
        if (!uploadOrderId || !slipFile) return;
        setIsUploading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                window.location.href = "/login";
                return;
            }

            const formData = new FormData();
            formData.append("file", slipFile);

            const res = await fetch(`http://localhost:3001/api/orders/${uploadOrderId}/slip`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "เกิดข้อผิดพลาดในการอัปโหลดสลิป");
            }

            alert("อัปโหลดสลิปสำเร็จ! รอการตรวจสอบจากทีมงาน");
            setIsUploadOpen(false);
            setSlipFile(null);
            fetchOrders(); // Refresh table to show new status
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleUploadPrintFile = async () => {
        if (!printFileUploadOrderId || !printFile) return;
        setIsPrintFileUploading(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                window.location.href = "/login";
                return;
            }

            // 1. Get Presigned URL - Now sending filename to preserve extension
            const urlRes = await fetch(`http://localhost:3001/api/orders/${printFileUploadOrderId}/presigned-url?filename=${encodeURIComponent(printFile.name)}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!urlRes.ok) {
                const data = await urlRes.json();
                throw new Error(data.error || "ไม่สามารถขอ URL สำหรับอัปโหลดไฟล์ได้");
            }

            const { presigned_url, file_url } = await urlRes.json();

            // 2. Upload file directly to S3 (PUT request)
            const uploadRes = await fetch(presigned_url, {
                method: "PUT",
                body: printFile,
                headers: {
                    // Make sure to match the content type if required by your S3 config, sometimes it's better to omit it and let browser decide, 
                    // or explicitly set it if backend enforces it.
                    "Content-Type": printFile.type || "application/octet-stream"
                }
            });

            if (!uploadRes.ok) {
                throw new Error("เกิดข้อผิดพลาดขณะส่งไฟล์ขึ้น Cloud Storage");
            }

            // 3. Notify backend about the new file_url
            const updateRes = await fetch(`http://localhost:3001/api/orders/${printFileUploadOrderId}/file-url`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ file_url })
            });

            if (!updateRes.ok) {
                const data = await updateRes.json();
                throw new Error(data.error || "อัปเดตข้อมูลไฟล์งานไม่สำเร็จ");
            }

            alert("อัปโหลดไฟล์งานเรียบร้อยแล้ว!");
            setIsPrintFileUploadOpen(false);
            setPrintFile(null);
            fetchOrders(); // Refresh table
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsPrintFileUploading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Pending_Payment":
                return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-none rounded-full px-4">รอชำระเงิน</Badge>;
            case "Payment_Checking":
                return <Badge variant="secondary" className="bg-primary/20 text-primary-foreground border-none rounded-full px-4">รอตรวจสอบ</Badge>;
            case "Producing":
                return <Badge variant="default" className="bg-primary text-primary-foreground shadow-sm rounded-full px-4">กำลังผลิต</Badge>;
            case "Completed":
                return <Badge variant="default" className="bg-accent text-primary-foreground shadow-sm rounded-full px-4 border-none">เสร็จสมบูรณ์</Badge>;
            case "Delivered":
                return <Badge variant="outline" className="text-muted-foreground border-muted rounded-full px-4">จัดส่งแล้ว</Badge>;
            default:
                return <Badge variant="outline" className="rounded-full px-4">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">ภาพรวมคำสั่งซื้อ (My Orders)</h1>
                    <p className="text-sm text-gray-500 mt-1">ประวัติการสั่งทำป้ายและสถานะปัจจุบัน</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchOrders} disabled={isLoading} className="shrink-0">
                    <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    รีเฟรช
                </Button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
                    {error}
                </div>
            )}

            {/* Status Tabs Navigation */}
            <div className="flex items-center gap-1 p-1 bg-secondary/20 rounded-2xl w-fit">
                {(["All", "Pending", "Production", "Finished"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab
                                ? "bg-white shadow-sm text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {tab === "All" && "ทั้งหมด"}
                        {tab === "Pending" && "รอชำระเงิน"}
                        {tab === "Production" && "กำลังผลิต"}
                        {tab === "Finished" && "เสร็จสมบูรณ์"}
                        <span className="ml-2 opacity-40 text-xs">
                            {tab === "All" && orders.length}
                            {tab === "Pending" && orders.filter(o => o.status === "Pending_Payment").length}
                            {tab === "Production" && orders.filter(o => o.status === "Payment_Checking" || o.status === "Producing").length}
                            {tab === "Finished" && orders.filter(o => o.status === "Completed" || o.status === "Delivered").length}
                        </span>
                    </button>
                ))}
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-hidden bg-background rounded-t-[inherit]">
                        <Table>
                            <TableHeader className="bg-secondary/30">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[100px] font-bold text-xs uppercase tracking-wider">รหัส</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-wider">วันที่</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-wider">รายละเอียด</TableHead>
                                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider">ราคารวม</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-wider text-center">ไฟล์</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-wider text-center">สลิป</TableHead>
                                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider">สถานะ</TableHead>
                                    <TableHead className="text-center font-bold text-xs uppercase tracking-wider">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center h-32">
                                            กำลังโหลดข้อมูล...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center h-64">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                                    <RefreshCcw className="w-8 h-8 text-gray-200" />
                                                </div>
                                                <div className="text-gray-500 font-medium">ไม่พบรายการ{activeTab !== "All" && `ในสถานะนี้`}</div>
                                                {activeTab === "All" && (
                                                    <Button variant="outline" className="rounded-xl border-dashed" onClick={() => window.location.href = '/customer/order'}>
                                                        เริ่มสร้างคำสั่งซื้อใหม่ที่นี่
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <TableRow key={order.id} className="hover:bg-gray-50/50">
                                            <TableCell className="font-medium text-xs">
                                                {order.id.split('-')[0]}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                                                {order.created_at ? format(new Date(order.created_at), "dd MMM yyyy HH:mm") : "-"}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {order.width_m} x {order.height_m} ม.
                                                <span className="text-muted-foreground text-xs ml-1">({order.total_sqm.toFixed(2)} ตร.ม.)</span>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-foreground">
                                                ฿{order.estimated_price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {order.file_url ? (
                                                    <a href={order.file_url} target="_blank" rel="noreferrer" className="text-primary-foreground bg-primary/20 hover:bg-primary/30 p-2 rounded-xl inline-flex items-center transition-colors">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs h-8 px-2"
                                                        onClick={() => {
                                                            setPrintFileUploadOrderId(order.id);
                                                            setIsPrintFileUploadOpen(true);
                                                        }}
                                                    >
                                                        อัปโหลด
                                                    </Button>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {order.slip_url ? (
                                                    <a href={order.slip_url} target="_blank" rel="noreferrer" className="text-primary-foreground bg-accent/20 hover:bg-accent/30 p-2 rounded-xl inline-flex items-center transition-colors">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                ) : <span className="text-muted-foreground text-xs">—</span>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {getStatusBadge(order.status)}
                                            </TableCell>
                                            <TableCell className="text-center py-4">
                                                {order.status === "Pending_Payment" && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="w-[120px] bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/10 border-none font-bold text-xs h-9"
                                                        onClick={() => {
                                                            setUploadOrderId(order.id);
                                                            setIsUploadOpen(true);
                                                        }}
                                                    >
                                                        <UploadCloud className="w-3.5 h-3.5 mr-1" />
                                                        แจ้งโอนเงิน
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="w-[120px] text-muted-foreground bg-secondary/50 hover:bg-secondary hover:text-foreground mt-2 rounded-xl border-none font-bold text-xs h-9"
                                                    onClick={() => handleReorder(order.id)}
                                                    disabled={isLoading}
                                                >
                                                    <CopyPlus className="w-3.5 h-3.5 mr-1" />
                                                    สั่งทำซ้ำ
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>อัปโหลดสลิปโอนเงิน</DialogTitle>
                        <DialogDescription>
                            กรุณาแนบรูปภาพสลิปโอนเงิน สำหรับออเดอร์ #{uploadOrderId?.split('-')[0]}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="slipFile">รูปภาพสลิป</Label>
                            <Input
                                id="slipFile"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setSlipFile(e.target.files[0]);
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>ยกเลิก</Button>
                        <Button onClick={handleUploadSlip} disabled={!slipFile || isUploading} className="bg-green-600 hover:bg-green-700">
                            {isUploading ? "กำลังบันทึก..." : "ยืนยันการโอนเงิน"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPrintFileUploadOpen} onOpenChange={setIsPrintFileUploadOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>อัปโหลดไฟล์งานป้ายใหม่</DialogTitle>
                        <DialogDescription>
                            กรุณาเลือกไฟล์งานป้ายสำหรับออเดอร์ #{printFileUploadOrderId?.split('-')[0]} (รองรับไฟล์ขนาดใหญ่)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="printFile">ไฟล์งาน (.psd, .ai, .pdf, .zip, .jpg, .png)</Label>
                            <Input
                                id="printFile"
                                type="file"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setPrintFile(e.target.files[0]);
                                    }
                                }}
                            />
                            {printFile && (
                                <p className="text-xs text-green-600 mt-2">
                                    ไฟล์ที่เลือก: {printFile.name} ({(printFile.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPrintFileUploadOpen(false)} disabled={isPrintFileUploading}>ยกเลิก</Button>
                        <Button onClick={handleUploadPrintFile} disabled={!printFile || isPrintFileUploading} className="bg-blue-600 hover:bg-blue-700">
                            {isPrintFileUploading ? "กำลังกำลังอัปโหลดไฟล์ขึ้น Cloud..." : "อัปโหลดไฟล์"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
