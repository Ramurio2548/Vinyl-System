"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    PlusCircle,
    TrendingUp,
    Package,
    Users,
    User,
    LogOut,
    UserCircle,
    ChevronDown,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
    user: any;
}

export function Navbar({ user }: NavbarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/");
    };

    const isAdmin = user?.role === "admin" || user?.role === "staff";

    const customerNavigation = [
        { name: "ภาพรวมออเดอร์", href: "/customer/dashboard", icon: LayoutDashboard },
        { name: "สั่งทำป้ายใหม่", href: "/customer/order", icon: PlusCircle },
        { name: "ผลงานของเรา", href: "/showcase", icon: Sparkles },
    ];

    const adminNavigation = [
        { name: "จัดการออเดอร์", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "รายงานยอดขาย", href: "/admin/analytics", icon: TrendingUp },
        { name: "จัดการวัสดุ/ราคา", href: "/admin/inventory", icon: Package },
        { name: "จัดการผลงาน", href: "/admin/showcase", icon: Sparkles },
        { name: "จัดการผู้ใช้", href: "/admin/users", icon: Users },
    ];

    const navigation = isAdmin ? adminNavigation : customerNavigation;
    const homeHref = isAdmin ? "/admin/dashboard" : "/customer/dashboard";
    const spaceLabel = isAdmin ? "Admin Space" : "Customer Space";

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo Section */}
                <div className="flex items-center gap-8">
                    <Link href={homeHref} className="flex items-center gap-2 group transition-all">
                        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 text-primary-foreground group-hover:scale-110 transition-transform">
                            <PlusCircle className="w-5 h-5 rotate-45" />
                        </div>
                        <div>
                            <h2 className="text-base font-black tracking-tight text-slate-800 leading-none">VINYL <span className="text-primary-foreground">SYSTEM</span></h2>
                            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{spaceLabel}</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${isActive
                                        ? "bg-primary/20 text-primary-foreground font-black"
                                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? "text-primary-foreground" : "text-slate-400"}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Profile Section */}
                <div className="flex items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-full md:w-auto flex items-center gap-3 px-2 md:px-3 hover:bg-slate-100 rounded-2xl group border border-transparent hover:border-slate-200 shadow-none transition-all">
                                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
                                    <User className="w-4 h-4" />
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-xs font-black text-slate-800 truncate leading-tight">
                                        {user?.username}
                                    </p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                                        {user?.role}
                                    </p>
                                </div>
                                <ChevronDown className="w-4 h-4 text-slate-400 group-data-[state=open]:rotate-180 transition-transform" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1 p-2">
                                    <p className="text-sm font-black leading-none text-slate-800">{user?.username}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest leading-none text-slate-400">
                                        {user?.role}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push("/customer/profile")} className="cursor-pointer gap-2 p-3 font-bold text-slate-600 focus:text-blue-600 focus:bg-blue-50">
                                <UserCircle className="w-4 h-4" />
                                <span>ข้อมูลส่วนตัว</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push("/customer/dashboard")} className="md:hidden cursor-pointer gap-2 p-3 font-bold text-slate-600 focus:text-blue-600 focus:bg-blue-50">
                                <LayoutDashboard className="w-4 h-4" />
                                <span>ภาพรวมคำสั่งซื้อ</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push("/customer/order")} className="md:hidden cursor-pointer gap-2 p-3 font-bold text-slate-600 focus:text-blue-600 focus:bg-blue-50">
                                <PlusCircle className="w-4 h-4" />
                                <span>สั่งทำป้ายใหม่</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="cursor-pointer gap-2 p-3 font-bold text-red-600 focus:text-red-700 focus:bg-red-50"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>ออกจากระบบ</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
