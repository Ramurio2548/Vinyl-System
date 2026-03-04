"use client";
import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { UserCircle, CheckCircle2 } from "lucide-react";

const profileSchema = z.object({
    full_name: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล").max(100),
    phone: z.string().min(9, "กรุณากรอกเบอร์โทรที่ถูกต้อง").max(20).optional().or(z.literal("")),
    address: z.string().max(500).optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: "",
            phone: "",
            address: "",
        },
    });

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    window.location.href = "/login";
                    return;
                }
                const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
                    headers: { "Authorization": `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลส่วนตัวได้");
                const data = await res.json();
                form.reset({
                    full_name: data.full_name ?? "",
                    phone: data.phone ?? "",
                    address: data.address ?? "",
                });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [form]);

    const onSubmit = async (values: ProfileFormValues) => {
        setIsSaving(true);
        setError(null);
        setIsSaved(false);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                window.location.href = "/login";
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    full_name: values.full_name || null,
                    phone: values.phone || null,
                    address: values.address || null,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");
            }
            setIsSaved(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">ข้อมูลส่วนตัว</h1>
                <p className="text-sm text-gray-500 mt-1">จัดการชื่อ เบอร์โทร และที่อยู่ของคุณ</p>
            </div>

            <Card className="border-none shadow-2xl shadow-primary/5 rounded-[2rem] overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-6 p-8 bg-primary/10">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10">
                        <UserCircle className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold">แก้ไขโปรไฟล์</CardTitle>
                        <CardDescription className="text-muted-foreground">ข้อมูลนี้จะใช้สำหรับการจัดส่งและติดต่อกลับ</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-500">กำลังโหลดข้อมูล...</div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                <FormField
                                    control={form.control}
                                    name="full_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ชื่อ-นามสกุล <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="เช่น สมชาย ใจดี" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>เบอร์โทรศัพท์</FormLabel>
                                            <FormControl>
                                                <Input placeholder="เช่น 0812345678" type="tel" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground/80 font-medium">ที่อยู่สำหรับจัดส่ง</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="เลขที่ ซอย ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
                                                    className="resize-none rounded-xl border-border/60 focus:ring-primary/20"
                                                    rows={4}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm">
                                        {error}
                                    </div>
                                )}

                                {isSaved && (
                                    <div className="p-3 bg-green-50 text-green-700 rounded-md border border-green-200 text-sm flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        บันทึกข้อมูลสำเร็จแล้ว!
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-xl font-bold shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
                                    disabled={isSaving}
                                >
                                    {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                                </Button>
                            </form>
                        </Form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
