"use client";
import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RefreshCcw, PackagePlus, Edit2 } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface InventoryItem {
    id: string;
    material_type: string;
    base_price_per_sqm: number;
    stock_quantity: number;
    is_active: boolean;
}

export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Edit Modal State
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [editPrice, setEditPrice] = useState("");
    const [editActive, setEditActive] = useState(true);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newType, setNewType] = useState("");
    const [newPrice, setNewPrice] = useState("");
    const [newQuantity, setNewQuantity] = useState("9999");
    const [newActive, setNewActive] = useState(true);

    const fetchInventory = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/api/admin/inventory", {
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
                throw new Error("Failed to fetch inventory from server");
            }
            const data = await res.json();
            setInventory(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);


    const handleEditSave = async () => {
        if (!editingItem) return;
        try {
            const token = localStorage.getItem("token");
            const payload = {
                base_price_per_sqm: parseFloat(editPrice),
                is_active: editActive,
            };

            const res = await fetch(`${API_BASE_URL}/api/inventory/${editingItem.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to update inventory item");

            setIsEditOpen(false);
            fetchInventory();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleCreateSave = async () => {
        try {
            const token = localStorage.getItem("token");
            const payload = {
                material_type: newType,
                base_price_per_sqm: parseFloat(newPrice),
                stock_quantity: parseFloat(newQuantity),
                is_active: newActive,
            };

            const res = await fetch(`${API_BASE_URL}/api/inventory`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to create inventory item");

            setIsCreateOpen(false);
            setNewType("");
            setNewPrice("");
            fetchInventory();
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-none">จัดการวัสดุและราคา</h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium">ตั้งค่าราคาต่อตารางเมตรและสถานะการรับออเดอร์ของวัสดุทั้งหมด</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchInventory} disabled={isLoading} className="rounded-xl">
                        <RefreshCcw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden rounded-3xl">
                <CardHeader className="flex flex-row items-center justify-between pb-6 border-b bg-slate-50/50">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold text-slate-800">สต็อกวัสดุและตารางราคา</CardTitle>
                        <CardDescription className="text-slate-500">
                            ข้อมูลราคาจะถูกนำไปคำนวณอัตโนมัติในหน้าสั่งซื้อของลูกค้า
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={fetchInventory} disabled={isLoading} className="rounded-xl bg-white border-slate-200">
                            <RefreshCcw className={`h-4 w-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>

                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">
                                    <PackagePlus className="w-4 h-4 mr-2" />
                                    เพิ่มวัสดุใหม่
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>เพิ่มวัสดุใหม่</DialogTitle>
                                    <DialogDescription>
                                        กรอกข้อมูลวัสดุสำหรับให้ลูกค้าเลือกในแบบฟอร์มสั่งทำป้าย
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="type" className="text-right">ชื่อวัสดุ</Label>
                                        <Input
                                            id="type"
                                            className="col-span-3"
                                            value={newType}
                                            onChange={(e) => setNewType(e.target.value)}
                                            placeholder="เช่น ไวนิลเกรดพรีเมียม"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="price" className="text-right">ราคา/ตร.ม.</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            className="col-span-3"
                                            value={newPrice}
                                            onChange={(e) => setNewPrice(e.target.value)}
                                            placeholder="150"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">สถานะ</Label>
                                        <div className="col-span-3 flex items-center space-x-2">
                                            <Switch
                                                checked={newActive}
                                                onCheckedChange={setNewActive}
                                            />
                                            <Label>{newActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}</Label>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-4">
                                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>ยกเลิก</Button>
                                    <Button onClick={handleCreateSave} disabled={!newType || !newPrice}>บันทึกวัสดุ</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow className="hover:bg-transparent border-b">
                                    <TableHead className="font-bold text-slate-600 py-4">ชนิดวัสดุ</TableHead>
                                    <TableHead className="text-right font-bold text-slate-600 py-4">ราคาตั้งต้น (บาท/ตร.ม.)</TableHead>
                                    <TableHead className="text-center font-bold text-slate-600 py-4">ปริมาณคงเหลือ</TableHead>
                                    <TableHead className="text-center font-bold text-slate-600 py-4">สถานะการแสดงผล</TableHead>
                                    <TableHead className="text-right font-bold text-slate-600 py-4 px-6">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && inventory.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">กำลังโหลดข้อมูล...</TableCell>
                                    </TableRow>
                                ) : inventory.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-gray-500">ไม่มีข้อมูลวัสดุในระบบ</TableCell>
                                    </TableRow>
                                ) : (
                                    inventory.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium text-sm">
                                                {item.material_type}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-blue-700">
                                                ฿{item.base_price_per_sqm.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                            </TableCell>
                                            <TableCell className="text-center text-gray-500 text-sm">
                                                {item.stock_quantity > 9000 ? "ไม่จำกัด" : item.stock_quantity}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.is_active
                                                    ? <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none rounded-full px-4 font-bold shadow-sm shadow-emerald-100">พร้อมใช้งาน</Badge>
                                                    : <Badge variant="secondary" className="text-slate-400 bg-slate-100 border-none rounded-full px-4 font-bold">ระงับชั่วคราว</Badge>
                                                }
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingItem(item);
                                                        setEditPrice(item.base_price_per_sqm.toString());
                                                        setEditActive(item.is_active);
                                                        setIsEditOpen(true);
                                                    }}
                                                >
                                                    <Edit2 className="w-4 h-4 mr-1 text-slate-500" />
                                                    แก้ไข
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Edit Modal (Outside table map to prevent multiple renders) */}
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>แก้ไขข้อมูลวัสดุ</DialogTitle>
                                <DialogDescription>
                                    ปรับราคา หรือระงับการสั่งทำของ {editingItem?.material_type}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right text-gray-500">ชื่อวัสดุ</Label>
                                    <span className="col-span-3 font-medium">{editingItem?.material_type}</span>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-price" className="text-right">ราคา/ตร.ม.</Label>
                                    <Input
                                        id="edit-price"
                                        type="number"
                                        className="col-span-3 font-mono"
                                        value={editPrice}
                                        onChange={(e) => setEditPrice(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4 mt-2">
                                    <Label className="text-right border-t pt-4">แสดงผลฝั่งลูกค้า</Label>
                                    <div className="col-span-3 flex items-center space-x-2 border-t pt-4">
                                        <Switch
                                            checked={editActive}
                                            onCheckedChange={setEditActive}
                                        />
                                        <Label>{editActive ? "ปกติ (รับออเดอร์)" : "ซ่อน (ของหมด)"}</Label>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <Button variant="outline" onClick={() => setIsEditOpen(false)}>ยกเลิก</Button>
                                <Button onClick={handleEditSave} className="bg-blue-600 hover:bg-blue-700">บันทึกการเปลี่ยนแปลง</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                </CardContent>
            </Card>
        </div>
    );
}