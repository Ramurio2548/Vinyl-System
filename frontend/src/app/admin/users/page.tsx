"use client";
import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Shield, User as UserIcon } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface User {
    id: string;
    username: string;
    role: string;
    created_at: string | null;
}

export default function UsersManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/api/admin/users", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to fetch users");
            }
            const data = await res.json();
            setUsers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const updateUserRole = async (userId: string, newRole: string) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to update role");
            }

            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err: any) {
            alert(err.message);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);


    const getRoleBadge = (role: string) => {
        switch (role) {
            case "admin":
                return <Badge className="bg-rose-500 hover:bg-rose-600 border-none rounded-full px-3 font-bold shadow-sm shadow-rose-100 uppercase text-[10px]">Admin</Badge>;
            case "staff":
                return <Badge className="bg-indigo-500 hover:bg-indigo-600 border-none rounded-full px-3 font-bold shadow-sm shadow-indigo-100 uppercase text-[10px]">Staff</Badge>;
            default:
                return <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none rounded-full px-3 font-bold uppercase text-[10px]">Customer</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                        <Shield className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">จัดการผู้ใช้และสิทธิ์</h1>
                        <p className="text-sm text-slate-500 mt-1">ตรวจสอบรายชื่อสมาขิกและมอบหมายระดับการเข้าถึงระบบ</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchUsers} disabled={isLoading} className="rounded-xl bg-white border-slate-200">
                        <RefreshCcw className={`h-4 w-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden rounded-3xl">
                <CardHeader className="flex flex-row items-center justify-between pb-6 border-b bg-slate-50/50">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold text-slate-800">รายชื่อผู้ใช้งานทั้งหมด</CardTitle>
                        <CardDescription className="text-slate-500">
                            สมาขิกที่ลงทะเบียนผ่านระบบ สามารถปรับบทบาทเพื่อเปิดสิทธิ์การเข้าถึงหน้า Admin ได้
                        </CardDescription>
                    </div>
                    <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-white hidden">
                        <Button variant="outline" size="icon" onClick={fetchUsers} disabled={isLoading} className="rounded-xl border-none shadow-none">
                            <RefreshCcw className={`h-4 w-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {error && (
                        <div className="m-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-200 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-b">
                                    <TableHead className="font-bold text-slate-600 py-4 px-6">ชื่อผู้ใช้ (Username)</TableHead>
                                    <TableHead className="font-bold text-slate-600 py-4 text-center">บทบาทปัจจุบัน</TableHead>
                                    <TableHead className="font-bold text-slate-600 py-4 text-center">วันที่ลงทะเบียน</TableHead>
                                    <TableHead className="font-bold text-slate-600 py-4 text-right px-8">เปลี่ยนระดับสิทธิ์</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-48">
                                            <div className="flex flex-col items-center gap-2">
                                                <RefreshCcw className="w-8 h-8 animate-spin text-slate-300" />
                                                <span className="text-slate-400 font-medium">กำลังดึงข้อมูลผู้ใช้...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-48 text-slate-400 font-medium">
                                            ไม่พบรายชื่อผู้ใช้งานในระบบ
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((u) => (
                                        <TableRow key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="py-4 px-6 font-semibold text-slate-700">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                        <UserIcon className="w-4 h-4" />
                                                    </div>
                                                    {u.username}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getRoleBadge(u.role)}
                                            </TableCell>
                                            <TableCell className="text-center text-slate-500 text-sm">
                                                {u.created_at ? format(new Date(u.created_at), "dd/MM/yyyy HH:mm") : "-"}
                                            </TableCell>
                                            <TableCell className="text-right px-8">
                                                <div className="flex justify-end">
                                                    <Select
                                                        value={u.role}
                                                        onValueChange={(val) => updateUserRole(u.id, val)}
                                                    >
                                                        <SelectTrigger className="w-[140px] rounded-xl h-9">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="customer">Customer</SelectItem>
                                                            <SelectItem value="staff">Staff</SelectItem>
                                                            <SelectItem value="admin">Admin</SelectItem>
                                                        </SelectContent>
                                                    </Select>
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