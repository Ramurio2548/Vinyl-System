"use client";
import { API_BASE_URL } from "@/lib/api";

import { useState, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileUp, Info, Maximize2, MoveHorizontal, MoveVertical, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
    width_m: z.number().min(0.1, "ความกว้างต้องมากกว่า 0.1 เมตร"),
    height_m: z.number().min(0.1, "ความสูงต้องมากกว่า 0.1 เมตร"),
    material_id: z.string().min(1, "กรุณาเลือกวัสดุ"),
    file_url: z.string().url("กรุณากรอกลิงก์ไฟล์ที่ถูกต้อง (เช่น Google Drive, Dropbox)").optional().or(z.literal('')),
});

interface Material {
    id: string;
    material_type: string;
    base_price_per_sqm: number;
    description?: string;
}

export default function OrderPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
    const [materials, setMaterials] = useState<Material[]>([]);

    // File State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Price State
    const [calculationResult, setCalculationResult] = useState<{ price: number, sqm: number } | null>(null);

    // Toast State
    const [showToast, setShowToast] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            width_m: 1,
            height_m: 1,
            material_id: "",
            file_url: "",
        },
    });

    const watchedValues = useWatch({ control: form.control });

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/inventory`);
                if (!res.ok) throw new Error("Failed to fetch materials");
                const data = await res.json();
                setMaterials(data);
                if (data.length > 0 && !form.getValues("material_id")) {
                    form.setValue("material_id", data[0].id);
                }
            } catch (err) {
                console.error("Error fetching materials", err);
            }
        };
        fetchMaterials();
    }, [form]);

    // Real-time calculation effect
    useEffect(() => {
        const calculate = async () => {
            const { width_m, height_m, material_id } = form.getValues();
            if (!width_m || !height_m || !material_id) return;

            setIsLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/api/calculator`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ width_m, height_m, material_id }),
                });
                const data = await res.json();
                if (res.ok) {
                    setCalculationResult({ price: data.estimated_price, sqm: data.total_sqm });
                }
            } catch (err) {
                console.error("Calculation error", err);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(calculate, 400); // Simple debounce
        return () => clearTimeout(timer);
    }, [watchedValues.width_m, watchedValues.height_m, watchedValues.material_id, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                window.location.href = "/login";
                return;
            }

            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const customerId = tokenPayload.sub;

            // 1. Create the Order first
            const res = await fetch(`${API_BASE_URL}/api/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...values,
                    customer_id: customerId,
                    file_url: null, // Initially null
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "ไม่สามารถสร้างคำสั่งซื้อได้");

            const orderId = data.order_id;

            // 2. If a file is selected, upload it
            if (selectedFile) {
                // 2.1 Get Presigned URL
                const fileType = encodeURIComponent(selectedFile.type || "application/octet-stream");
                const urlRes = await fetch(`${API_BASE_URL}/api/orders/${orderId}/presigned-url?filename=${encodeURIComponent(selectedFile.name)}&content_type=${fileType}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (!urlRes.ok) throw new Error("ไม่สามารถขอ URL สำหรับอัปโหลดไฟล์ได้");
                const { presigned_url, file_url: s3_file_url } = await urlRes.json();

                // 2.2 PUT to S3
                const uploadRes = await fetch(presigned_url, {
                    method: "PUT",
                    body: selectedFile,
                    headers: { "Content-Type": selectedFile.type || "application/octet-stream" }
                });

                if (!uploadRes.ok) throw new Error("การอัปโหลดไฟล์ล้มเหลว");

                // 2.3 Update order with file_url
                await fetch(`${API_BASE_URL}/api/orders/${orderId}/file-url`, {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ file_url: s3_file_url })
                });
            }

            // 3. Show Toast and then final card
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
                setSuccessOrderId(orderId);
            }, 3000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    // Visual Preview Logic
    const previewScale = useMemo(() => {
        const w = (watchedValues.width_m || 1);
        const h = (watchedValues.height_m || 1);
        const max = Math.max(w, h);
        const scale = 220 / max; // Max size 220px
        return { w: w * scale, h: h * scale };
    }, [watchedValues.width_m, watchedValues.height_m]);

    if (successOrderId) {
        return (
            <div className="container mx-auto max-w-xl py-20 px-4 text-center">
                <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white/50 backdrop-blur-xl">
                    <CardContent className="pt-20 pb-20">
                        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 mx-auto shadow-xl shadow-green-200 animate-bounce">
                            <CheckCircle2 className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">สั่งพิมพ์สำเร็จ!</h2>
                        <p className="text-lg text-gray-600 mb-10">เราได้รับรายการของคุณแล้ว</p>
                        <div className="bg-gray-50 p-6 rounded-3xl inline-block mb-10 border border-gray-100 italic">
                            รหัสคำสั่งซื้อ: <span className="font-mono font-bold text-primary">#{successOrderId.split('-')[0]}</span>
                        </div>
                        <div className="flex flex-col gap-4 max-w-xs mx-auto">
                            <Button className="h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20" onClick={() => window.location.href = "/customer/dashboard"}>
                                ไปหน้าจัดการคำสั่งซื้อ
                            </Button>
                            <Button variant="ghost" className="h-12 rounded-2xl font-semibold opacity-60" onClick={() => window.location.reload()}>
                                สั่งพิมพ์รายการใหม่
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 min-h-screen">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start">

                {/* Left Side: Preview & Summary */}
                <div className="w-full lg:w-1/2 space-y-6 lg:sticky lg:top-10">
                    <div className="bg-gradient-to-br from-primary/10 to-blue-50/50 p-1 rounded-[2.5rem] shadow-sm">
                        <Card className="border-none shadow-none rounded-[2.4rem] bg-white/40 backdrop-blur-xl h-full min-h-[400px] flex flex-col items-center justify-center p-10 overflow-hidden relative">

                            <div className="absolute top-6 left-10 flex items-center gap-2 text-primary/60">
                                <Maximize2 className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-widest">Real-time Preview</span>
                            </div>

                            {/* Vinyl Visual Box */}
                            <div
                                className="bg-white shadow-2xl rounded-sm border-4 border-gray-100 flex flex-col items-center justify-center transition-all duration-500 ease-out group relative overflow-hidden"
                                style={{ width: previewScale.w, height: previewScale.h }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-40 group-hover:opacity-10 opacity-transition" />
                                <div className="z-10 text-center animate-in fade-in zoom-in duration-500">
                                    <Sparkles className="w-6 h-6 text-primary/20 mb-2 mx-auto" />
                                    <p className="text-[10px] font-bold text-gray-400">VINYL PRINT</p>
                                </div>

                                {/* Label indicators */}
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <MoveHorizontal className="w-3 h-3" /> {watchedValues.width_m} m
                                </div>
                                <div className="absolute top-1/2 -right-16 -translate-y-1/2 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1 rotate-90">
                                    <MoveVertical className="w-3 h-3" /> {watchedValues.height_m} m
                                </div>
                            </div>

                            <div className="mt-20 w-full">
                                {calculationResult ? (
                                    <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-500 italic">พื้นที่รวม: {calculationResult.sqm.toFixed(2)} ตร.ม.</span>
                                            <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-widest px-3">Estimate Price</Badge>
                                        </div>
                                        <div className="text-6xl font-black text-primary tracking-tighter">
                                            ฿{calculationResult.price.toLocaleString()}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2 italic">*ราคานี้ยังไม่รวมค่าบริการออกแบบ (ถ้ามี)</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-300 py-10">
                                        <div className="animate-pulse flex items-center gap-3">
                                            <div className="h-8 w-32 bg-gray-100 rounded-full" />
                                        </div>
                                        <p className="text-xs mt-4">กำลังคำนวณราคาที่ดีที่สุดให้คุณ...</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    <div className="bg-yellow-50/50 border border-yellow-100 p-6 rounded-[2rem] flex items-start gap-4">
                        <div className="bg-yellow-100 p-2 rounded-xl text-yellow-700">
                            <Info className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-yellow-800 text-sm">ข้อควรรู้</h4>
                            <p className="text-xs text-yellow-700/80 leading-relaxed mt-1">
                                ไฟล์งานควรมีความละเอียดอย่างน้อย 72-150 DPI ในขนาดจริง
                                ระบบจะทำการอัปโหลดไฟล์งานของคุณขึ้น Cloud Storage โดยตรงเพื่อให้ทีมงานได้รับไฟล์งานคุณภาพดีที่สุด
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="w-full lg:w-1/2">
                    <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                        <CardHeader className="p-10 pb-4">
                            <CardTitle className="text-3xl font-black tracking-tight text-gray-900">ระบุรายละเอียด</CardTitle>
                            <CardDescription className="text-base text-gray-500">ใส่ขนาดและเลือกวัสดุที่ต้องการผลิต</CardDescription>
                        </CardHeader>
                        <CardContent className="p-10 pt-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                                    <div className="space-y-4">
                                        <FormLabel className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <Maximize2 className="w-4 h-4 text-primary" /> ขนาดพื้นที่
                                        </FormLabel>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="width_m"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-2">
                                                        <div className="relative group">
                                                            <Input
                                                                type="number"
                                                                step="0.1"
                                                                className="h-14 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all pl-12 text-lg font-bold"
                                                                {...field}
                                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                            />
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary">
                                                                <MoveHorizontal className="w-5 h-5" />
                                                            </div>
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-300 uppercase">กว้าง (ม.)</div>
                                                        </div>
                                                        <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="height_m"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-2">
                                                        <div className="relative group">
                                                            <Input
                                                                type="number"
                                                                step="0.1"
                                                                className="h-14 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all pl-12 text-lg font-bold"
                                                                {...field}
                                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                            />
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary">
                                                                <MoveVertical className="w-5 h-5" />
                                                            </div>
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-300 uppercase">สูง (ม.)</div>
                                                        </div>
                                                        <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <FormLabel className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-primary" /> เลือกวัสดุ
                                        </FormLabel>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {materials.map((mat) => (
                                                <div
                                                    key={mat.id}
                                                    onClick={() => form.setValue("material_id", mat.id)}
                                                    className={cn(
                                                        "p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group hover:shadow-md",
                                                        watchedValues.material_id === mat.id
                                                            ? "border-primary bg-primary/5 shadow-inner"
                                                            : "border-gray-100 bg-white hover:border-gray-200"
                                                    )}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        <span className={cn(
                                                            "font-bold text-sm",
                                                            watchedValues.material_id === mat.id ? "text-primary" : "text-gray-700"
                                                        )}>{mat.material_type}</span>
                                                        <span className="text-[10px] text-gray-400 tracking-wider">฿{mat.base_price_per_sqm}/ตร.ม.</span>
                                                    </div>
                                                    {watchedValues.material_id === mat.id && (
                                                        <div className="absolute top-2 right-2 text-primary animate-in zoom-in duration-300">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {materials.length === 0 && (
                                                <div className="col-span-full h-24 bg-gray-50 rounded-2xl flex items-center justify-center italic text-xs text-gray-400">
                                                    กำลังโหลดวัสดุ...
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <FormLabel className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                            <FileUp className="w-4 h-4 text-primary" /> ไฟล์งาน (Upload File)
                                        </FormLabel>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="file-upload"
                                                className="hidden"
                                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            />
                                            <label
                                                htmlFor="file-upload"
                                                className={cn(
                                                    "flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed transition-all cursor-pointer",
                                                    selectedFile
                                                        ? "border-primary bg-primary/5 text-primary"
                                                        : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-400"
                                                )}
                                            >
                                                <FileUp className={cn("w-8 h-8 mb-2", selectedFile ? "text-primary" : "text-gray-300")} />
                                                <span className="text-xs font-bold">
                                                    {selectedFile ? selectedFile.name : "เลือกไฟล์งานของคุณ"}
                                                </span>
                                                <span className="text-[10px] mt-1 opacity-60">
                                                    {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "รองรับไฟล์ภาพขนาดใหญ่"}
                                                </span>
                                            </label>
                                            {selectedFile && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedFile(null)}
                                                    className="absolute top-2 right-2 text-[10px] font-bold text-red-500 hover:underline"
                                                >
                                                    ลบไฟล์
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || !calculationResult}
                                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-16 rounded-[1.5rem] font-bold text-xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
                                        >
                                            {isSubmitting ? "กำลังส่งและอัปโหลด..." : "สั่งพิมพ์ทันที"}
                                        </Button>
                                        <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-tighter">
                                            Direct upload to Cloud Storage enabled.
                                        </p>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {error && (
                <div className="mt-8 max-w-6xl mx-auto p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3 italic text-sm">
                    <Info className="w-4 h-4" /> {error}
                </div>
            )}

            {/* Toast Notification */}
            <div className={cn(
                "fixed top-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform",
                showToast ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0 pointer-events-none"
            )}>
                <div className="bg-primary text-primary-foreground px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 font-bold border-4 border-white">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    สั่งพิมพ์และอัปโหลดไฟล์สำเร็จ!
                </div>
            </div>
        </div>
    );
}
