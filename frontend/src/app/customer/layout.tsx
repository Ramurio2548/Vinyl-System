"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";

export default function CustomerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
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
        setUser(parsedUser);
    }, [router]);

    if (!isMounted || !user) {
        return <div className="min-h-screen flex items-center justify-center">กำลังโหลดข้อมูล...</div>;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <Navbar user={user} />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
