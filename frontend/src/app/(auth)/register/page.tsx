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
import { UserPlus, ArrowLeft, CheckCircle2 } from "lucide-react";

const registerSchema = z.object({
    username: z.string().min(3, "ชื่อผู้ใช้งานต้องมีอย่างน้อย 3 ตัวอักษร"),
    password_raw: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
    confirm_password: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
}).refine((data) => data.password_raw === data.confirm_password, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirm_password"],
});

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: "",
            password_raw: "",
            confirm_password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof registerSchema>) {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: values.username,
                    password_raw: values.password_raw,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "สมัครสมาชิกไม่สำเร็จ");
            }

            setIsSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    if (isSuccess) {
        return (
            <div className="flex h-screen items-center justify-center px-4 bg-background">
                <Card className="w-full max-w-sm border-none shadow-2xl rounded-3xl overflow-hidden text-center p-10">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">สมัครสมาชิกสำเร็จ!</h2>
                    <p className="text-gray-500 mb-8">กำลังพาท่านไปหน้าเข้าสู่ระบบ...</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex h-screen items-center justify-center px-4 bg-background">
            <Card className="w-full max-w-sm border-none shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden">
                <CardHeader className="pt-10 pb-6 bg-primary/10">
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                        <UserPlus className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-center text-primary-foreground font-bold">สมัครสมาชิก</CardTitle>
                    <CardDescription className="text-center text-primary-foreground/70">
                        สร้างบัญชีใหม่เพื่อเริ่มสั่งพิมพ์และติดตามงาน
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ชื่อผู้ใช้งาน (Username)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="user123" {...field} />
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
                            <FormField
                                control={form.control}
                                name="confirm_password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12 text-md font-semibold mt-2" disabled={isLoading}>
                                {isLoading ? "กำลังประมวลผล..." : "สมัครสมาชิก"}
                            </Button>
                        </form>
                    </Form>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm italic">
                            {error}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2 pb-10">
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => router.push("/login")}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}