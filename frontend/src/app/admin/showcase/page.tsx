"use client";
import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit3, Eye, EyeOff, Loader2, Sparkles, Image as ImageIcon, Search } from "lucide-react";

interface ShowcaseItem {
    id: string;
    title: string;
    description: string;
    image_url: string;
    category: string;
    example_price: number;
    is_visible: boolean;
}

export default function AdminShowcasePage() {
    const [items, setItems] = useState<ShowcaseItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Form states
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        image_url: "",
        category: "",
        example_price: ""
    });

    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/admin/showcase`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (err) {
            console.error("Failed to fetch showcase items:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsActionLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/admin/showcase`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    example_price: parseFloat(formData.example_price) || 0
                })
            });
            if (res.ok) {
                setIsCreateOpen(false);
                setFormData({ title: "", description: "", image_url: "", category: "", example_price: "" });
                fetchItems();
            }
        } catch (err) {
            console.error("Failed to create item:", err);
        } finally {
            setIsActionLoading(false);
        }
    };

    const toggleVisibility = async (id: string, currentVisible: boolean) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/admin/showcase/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ is_visible: !currentVisible })
            });
            if (res.ok) fetchItems();
        } catch (err) {
            console.error("Failed to toggle visibility:", err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("ยืนยันการลบผลงานนี้?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/admin/showcase/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) fetchItems();
        } catch (err) {
            console.error("Failed to delete item:", err);
        }
    };

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-none">จัดการผลงาน (Showcase)</h1>
                        <p className="text-sm text-slate-500 mt-2 font-medium">เพิ่มรูปภาพตัวอย่างและราคาผลงานที่ผ่านมาเพื่อแสดงในหน้า Gallery</p>
                    </div>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-2xl font-black gap-2 h-12 px-6 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                            <Plus className="w-5 h-5" />
                            เพิ่มผลงานใหม่
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-8">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">เพิ่มผลงานเข้า Gallery</DialogTitle>
                            <DialogDescription className="font-medium text-slate-500">กรอกรายละเอียดผลงานเพื่อจัดแสดงบนเว็บไซต์</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-5 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="font-bold text-slate-700">ชื่อผลงาน</Label>
                                <Input
                                    id="title"
                                    placeholder="เช่น ป้ายร้านกาแฟมินิมอล"
                                    className="rounded-xl h-11 border-slate-200"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700">รูปภาพผลงาน</Label>
                                <div className="flex flex-col gap-4">
                                    {formData.image_url ? (
                                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 group">
                                            <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="rounded-xl font-bold"
                                                    onClick={() => setFormData({ ...formData, image_url: "" })}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    ลบรูปและเลือกใหม่
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                id="file-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    setIsActionLoading(true);
                                                    try {
                                                        const token = localStorage.getItem("token");
                                                        const uploadFormData = new FormData();
                                                        uploadFormData.append("file", file);

                                                        const res = await fetch(`${API_BASE_URL}/api/admin/showcase/upload`, {
                                                            method: "POST",
                                                            headers: { "Authorization": `Bearer ${token}` },
                                                            body: uploadFormData
                                                        });

                                                        if (res.ok) {
                                                            const { url } = await res.json();
                                                            setFormData({ ...formData, image_url: url });
                                                        }
                                                    } catch (err) {
                                                        console.error("Upload failed:", err);
                                                    } finally {
                                                        setIsActionLoading(false);
                                                    }
                                                }}
                                            />
                                            <label
                                                htmlFor="file-upload"
                                                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-slate-50 hover:border-primary/50 transition-all group"
                                            >
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <div className="p-3 bg-white rounded-xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                                        <Plus className="w-6 h-6 text-slate-400" />
                                                    </div>
                                                    <p className="mb-1 text-sm text-slate-600 font-bold">คลิกเพื่ออัปโหลดรูปภาพ</p>
                                                    <p className="text-xs text-slate-400 font-medium">PNG, JPG หรือ GIF</p>
                                                </div>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="font-bold text-slate-700">หมวดหมู่</Label>
                                    <Input
                                        id="category"
                                        placeholder="Banner / Sticker"
                                        className="rounded-xl h-11 border-slate-200"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="font-bold text-slate-700">ราคาตัวอย่าง (฿)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        placeholder="150"
                                        className="rounded-xl h-11 border-slate-200"
                                        value={formData.example_price}
                                        onChange={(e) => setFormData({ ...formData, example_price: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="desc" className="font-bold text-slate-700">คำอธิบาย</Label>
                                <Textarea
                                    id="desc"
                                    placeholder="อธิบายรายละเอียดผลงาน..."
                                    className="rounded-xl min-h-[100px] border-slate-200"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={isActionLoading || !formData.image_url} className="w-full rounded-xl h-12 font-black">
                                    {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "บันทึกและแสดงผล"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden rounded-3xl">
                <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center justify-between pb-6">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold">รายการผลงานทั้งหมด</CardTitle>
                        <CardDescription className="font-medium">จัดการสถานะการแสดงผลและข้อมูลผลงาน</CardDescription>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="ค้นหาผลงาน..."
                            className="rounded-xl h-10 pl-9 border-slate-200 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-b">
                                    <TableHead className="font-bold text-slate-600 py-4 px-6 w-24">รูปภาพ</TableHead>
                                    <TableHead className="font-bold text-slate-600 py-4">ข้อมูลผลงาน</TableHead>
                                    <TableHead className="font-bold text-slate-600 py-4 text-center">หมวดหมู่</TableHead>
                                    <TableHead className="font-bold text-slate-600 py-4 text-right">ราคาเริ่มต้น</TableHead>
                                    <TableHead className="font-bold text-slate-600 py-4 text-center">สถานะ</TableHead>
                                    <TableHead className="font-bold text-slate-600 py-4 text-right px-8">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-48">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                                                <span className="text-slate-400 font-medium tracking-wide">กำลังโหลดข้อมูล...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-48 text-slate-400 font-bold">
                                            ไม่พบผลงานที่กำลังแสดง
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredItems.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="py-4 px-6">
                                                <div className="w-16 h-12 rounded-lg bg-slate-100 overflow-hidden relative border border-slate-200">
                                                    <img src={item.image_url} alt="" className="object-cover w-full h-full" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 line-clamp-1">{item.title}</span>
                                                    <span className="text-xs text-slate-400 line-clamp-1">{item.description || "ไม่มีคำอธิบาย"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-none rounded-full px-3 font-bold text-[10px]">
                                                    {item.category || "GENERAL"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-black text-slate-700">
                                                ฿{item.example_price.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.is_visible ? (
                                                    <Badge className="bg-emerald-500 border-none rounded-full px-3 font-bold uppercase text-[10px]">แสดงในเว็ปไซน์</Badge>
                                                ) : (
                                                    <Badge className="bg-slate-300 border-none rounded-full px-3 font-bold uppercase text-[10px]">ซ่อนอยู่</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right px-8">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="icon" className="rounded-xl border-slate-200 hover:bg-slate-50" onClick={() => toggleVisibility(item.id, item.is_visible)}>
                                                        {item.is_visible ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-emerald-500" />}
                                                    </Button>
                                                    <Button variant="outline" size="icon" className="rounded-xl border-red-100 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                                                        <Trash2 className="w-4 h-4 text-red-400" />
                                                    </Button>
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
        </div>
    );
}
