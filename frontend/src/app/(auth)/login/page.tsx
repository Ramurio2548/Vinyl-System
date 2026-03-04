"use client";
import { API_BASE_URL } from "@/lib/api";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const loginSchema = z.object({
    username: z.string().min(1, "กรุณากรอกชื่อผู้ใช้งาน"),
    password_raw: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password_raw: "",
        },
    });

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "เข้าสู่ระบบไม่สำเร็จ");
            }

            // Store JWT token (In a real app, prefer HttpOnly cookies instead of localStorage for security,
            // but localStorage is fine for this MVP dashboard context)
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            // Redirect based on role
            if (data.user.role === "admin" || data.user.role === "staff") {
                router.push("/admin/dashboard");
            } else {
                router.push("/customer/dashboard");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex h-screen items-center justify-center px-4 bg-background">
            <Card className="w-full max-w-sm border-none shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden">
                <CardHeader className="pt-10 pb-6 bg-primary/10">
                    <CardTitle className="text-2xl text-center text-primary-foreground font-bold">เข้าสู่ระบบ</CardTitle>
                    <CardDescription className="text-center text-primary-foreground/70">
                        จัดการการสั่งพิมพ์และติดตามสถานะงาน
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ชื่อผู้ใช้งาน (Username)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="admin" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password_raw"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>รหัสผ่าน (Password)</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12 text-md font-semibold mt-2" disabled={isLoading}>
                                {isLoading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
                            </Button>
                        </form>
                    </Form>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm">
                            {error}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2 pb-8">
                    <Button variant="outline" className="w-full rounded-xl border-dashed" onClick={() => router.push("/register")}>
                        ยังไม่มีบัญชี? สมัครสมาชิกที่นี่
                    </Button>
                    <Button variant="link" size="sm" className="text-muted-foreground" onClick={() => router.push("/")}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> กลับไปหน้าหลัก
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}