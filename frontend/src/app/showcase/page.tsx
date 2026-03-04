"use client";
import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, Image as ImageIcon, Sparkles } from "lucide-react";

interface ShowcaseItem {
    id: string;
    title: string;
    description: string;
    image_url: string;
    category: string;
    example_price: number;
}

export default function ShowcasePage() {
    const [items, setItems] = useState<ShowcaseItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) setUser(JSON.parse(userStr));

        const fetchShowcase = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/showcase");
                if (res.ok) {
                    const data = await res.json();
                    setItems(data);
                }
            } catch (err) {
                console.error("Failed to fetch showcase:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchShowcase();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Navbar user={user} />

            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-12">
                    {/* Header Section */}
                    <div className="text-center space-y-4 py-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                            <Sparkles className="w-3 h-3" />
                            Portfolio & Gallery
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
                            ผลงานที่ผ่านมา <span className="text-primary">ระดับพรีเมียม</span>
                        </h1>
                        <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                            รวบรวมตัวอย่างงานพิมพ์ไวนิลและสติกเกอร์คุณภาพสูงที่เราเคยจัดทำ เพื่อเป็นแรงบันดาลใจให้กับออเดอร์ถัดไปของคุณ
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="h-96 bg-white animate-pulse rounded-3xl border border-slate-100 shadow-sm" />
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                            <ImageIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">ยังไม่มีผลงานที่ถูกจัดแสดงในขณะนี้</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {items.map((item) => (
                                <Card key={item.id} className="group border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white hover:translate-y-[-8px] transition-all duration-300">
                                    <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                                        <img
                                            src={item.image_url}
                                            alt={item.title}
                                            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                                            <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none shadow-sm rounded-xl px-3 py-1 font-bold">
                                                {item.category || "ทั่วไป"}
                                            </Badge>
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                            <p className="text-white/80 text-sm font-medium line-clamp-2">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800 line-clamp-1">{item.title}</h3>
                                                <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                                                    <Tag className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">{item.category || "General"}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest leading-none mb-1">เริ่มต้นที่</p>
                                                <p className="text-2xl font-black text-primary">฿{item.example_price?.toLocaleString() || "0"}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Footer Call to Action */}
                    <div className="bg-slate-900 rounded-[3rem] p-12 text-center text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10 space-y-6">
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight">ต้องการงานคุณภาพแบบนี้ใช่ไหม?</h2>
                            <p className="text-slate-400 max-w-xl mx-auto font-medium">
                                เริ่มสั่งทำป้ายไวนิลของคุณวันนี้ด้วยระบบพรีเมียม เช็คราคาเรียลไทม์ และอัปโหลดไฟล์งานได้ทันที
                            </p>
                            <button
                                onClick={() => window.location.href = user ? "/customer/order" : "/login"}
                                className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                            >
                                สั่งทำป้ายใหม่เลย
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}