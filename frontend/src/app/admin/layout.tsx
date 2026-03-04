"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (!token || !userStr) {
            router.push("/login");
            return;
        }

        const parsedUser = JSON.parse(userStr);
        if (parsedUser.role !== "admin" && parsedUser.role !== "staff") {
            router.push("/customer/dashboard");
            return;
        }
        setUser(parsedUser);
    }, [router]);

    if (!isMounted || !user) {
        return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground font-medium">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                กำลังตรวจสอบสิทธิ์เข้าถึง...
            </div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <Navbar user={user} />

            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
