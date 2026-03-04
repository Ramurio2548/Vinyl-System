import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Printer, Clock, BadgeCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">

      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <Printer className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">VINYL <span className="text-muted-foreground font-medium">SYSTEM</span></span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block">
              เข้าสู่ระบบ
            </Link>
            <Link href="/register">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl px-8 h-12 shadow-lg shadow-primary/10 border-none">
                เริ่มใช้งาน
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Modern Hero Section */}
        <section className="relative pt-24 pb-32">
          {/* Subtle Background Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 bg-[radial-gradient(circle_at_top,oklch(0.92_0.12_95/0.15),transparent_70%)]" />

          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary-foreground text-sm font-medium mb-10 animate-fade-in">
              <BadgeCheck className="w-4 h-4" />
              <span>ระบบใหม่ล่าสุดสำหรับร้านป้าย</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-10 leading-[1.1]">
              สั่งพิมพ์ป้าย <br />
              <span className="bg-gradient-to-r from-primary-foreground to-muted-foreground bg-clip-text text-transparent">เรียบง่ายกว่าที่เคย</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-14 max-w-2xl mx-auto leading-relaxed font-light">
              สัมผัสประสบการณ์การสั่งพิมพ์รูปแบบใหม่ <br className="hidden md:block" />
              คำนวณราคาอัตโนมัติ อัปโหลดง่าย พร้อมระบบติดตามสถานะ 24 ชั่วโมง
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/customer/order">
                <Button size="lg" className="h-16 px-12 text-lg bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-2xl shadow-primary/20 border-none group">
                  ประเมินราคาเลย
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="h-16 px-12 text-lg bg-background/50 border-border rounded-2xl hover:bg-secondary/50 backdrop-blur-sm">
                  สร้างบัญชีฟรี
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section className="py-32">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-bold mb-6">ฟีเจอร์ระดับพรีเมียม</h2>
              <p className="text-muted-foreground max-w-xl mx-auto font-light">ครบถ้วนทุกความต้องการในการบริหารจัดการและสั่งพิมพ์ป้ายไวนิล</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[240px]">
              {/* Feature 1: Large Bento Item */}
              <div className="md:col-span-2 md:row-span-2 bg-secondary/30 rounded-[2.5rem] p-12 border border-border/50 flex flex-col justify-end group hover:bg-secondary/50 transition-all duration-500 overflow-hidden relative">
                <div className="absolute top-12 right-12 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-primary text-primary-foreground rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-primary/10">
                    <Printer className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">ระบบคำนวณราคาอัจฉริยะ</h3>
                  <p className="text-lg text-muted-foreground font-light max-w-md leading-relaxed">
                    ไม่ใช่แค่การกรอกขนาด แต่ระบบจะวิเคราะห์วัสดุ ความหนา และการเก็บขอบ เพื่อให้ได้ราคาที่แม่นยำที่สุดในทันที
                  </p>
                </div>
              </div>

              {/* Feature 2: Square Bento Item */}
              <div className="bg-background rounded-[2.5rem] p-10 border border-border/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col justify-between">
                <div className="w-12 h-12 bg-secondary text-primary-foreground rounded-2xl flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">เข้าถึงได้ 24/7</h3>
                  <p className="text-muted-foreground font-light leading-relaxed">
                    สั่งงานตอนไหนก็ได้ ระบบรองรับการทำงานตลอด 24 ชั่วโมง
                  </p>
                </div>
              </div>

              {/* Feature 3: Square Bento Item */}
              <div className="bg-background rounded-[2.5rem] p-10 border border-border/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col justify-between">
                <div className="w-12 h-12 bg-primary/20 text-primary-foreground rounded-2xl flex items-center justify-center">
                  <BadgeCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">เช็คสถานะเรียลไทม์</h3>
                  <p className="text-muted-foreground font-light leading-relaxed">
                    แจ้งเตือนทุกขั้นตอน ตั้งแต่รับคิว พิมพ์เสร็จ ไปจนถึงพร้อมส่ง
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-border/40 py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6 h-full flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
              <Printer className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">VINYL SYSTEM</span>
          </div>

          <div className="flex gap-10 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">เงื่อนไขการใช้งาน</a>
            <a href="#" className="hover:text-foreground transition-colors">นโยบายความเป็นส่วนตัว</a>
            <a href="#" className="hover:text-foreground transition-colors">ติดต่อเรา</a>
          </div>

          <p className="text-muted-foreground text-sm font-light">
            © {new Date().getFullYear()} Vinyl Printing. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
