# Software Requirements Specification (SRS)
**ชื่อโปรเจกต์:** ระบบจัดการร้านบริการพิมพ์ป้ายไวนิล (กลุ่มไผ่อวบหรอ?)
**เวอร์ชัน:** 1.0.0

## 1. Introduction
**Purpose & Scope:** 
ระบบนี้จัดทำขึ้นเพื่อแก้ปัญหาการจัดการออเดอร์ที่ไม่เป็นระบบ การรอคอยราคาและคิวงานที่ล่าช้า และปัญหาการหาไฟล์งานลูกค้าซ้ำซาก ระบบขอบเขตครอบคลุมถึงการสั่งทำป้าย, การอัปโหลดไฟล์, การคำนวณราคาอัตโนมัติตามตารางเมตรและวัสดุ, สั่งทำซ้ำ (Re-order), ระบบชำระเงิน, และหน้า Dashboard เพื่อติดตามสถานะทั้งฝั่งลูกค้าและร้านค้า

---

## 2. User Roles (User Classes)
ผู้ใช้งานในระบบแบ่งออกเป็น 3 บทบาทหลัก ดังนี้:

### 2.1 ลูกค้า (Customer)
* **ลักษณะผู้ใช้:** ลูกค้าทั่วไป, นักเรียน/นักศึกษา, เจ้าของธุรกิจ SMEs ออนไลน์, เจ้าของร้านค้า
* **สิทธิ์และคุณลักษณะ:**
  * สามารถอัปโหลดไฟล์งาน เลือกระบุขนาดและวัสดุ (เช่น ไวนิล, สติกเกอร์) เพื่อดูราคาเบื้องต้นอัตโนมัติ (24 ชม.)
  * สามารถสั่งซื้อ ชำระเงิน และส่งสลิปผ่านระบบ
  * สามารถดูประวัติการสั่งซื้อและกดสั่งซ้ำในคลิกเดียว (Re-order)
  * สามารถติดตามสถานะการผลิตของงานตัวเองแบบเรียลไทม์

### 2.2 พนักงานหน้าร้าน (Admin)
* **ลักษณะผู้ใช้:** เจ้าของร้าน, พนักงานการตลาด, พนักงานขายหน้าร้าน, ฝ่ายบริการลูกค้า
* **สิทธิ์และคุณลักษณะ:**
  * สามารถดูและจัดการคำสั่งซื้อของลูกค้า ยืนยันยอดเงินและการชำระเงิน
  * สามารถอัปเดตสถานะการสั่งซื้อ (รับงาน, กำลังผลิต, เสร็จสิ้น, จัดส่ง)
  * สามารถตรวจสอบประวัติลูกค้าเพื่อทำโปรโมชั่น (CRM) และดูรายงานยอดขาย/สถิติ
  * ไม่ต้องตอบคำถามราคาซ้ำซาก ลดปัญหาการจัดการคิวงานด้วยระบบที่ชัดเจน

### 2.3 ช่างพิมพ์ (Operator)
* **ลักษณะผู้ใช้:** ทีมผู้ผลิตหน้าเครื่องพิมพ์
* **สิทธิ์และคุณลักษณะ:**
  * ดูคิวงานที่ได้รับอนุมัติแล้ว พร้อมดึงไฟล์ภาพจากระบบไปผลิต
  * อัปเดตสถานะงานเมื่อสั่งพิมพ์เรียบร้อย เพื่อให้ระบบแจ้งเตือนไปยังพนักงานและลูกค้า

---

## 3. Functional Requirements (FR)

### FR-001: ระบบรับออเดอร์และอัปโหลดไฟล์ (Order & Upload System)
* **Input:** ไฟล์งาน (เช่น PDF, JPG, PNG) และรายละเอียดคำสั่งซื้อ
* **Processing:** ระบบบันทึกไฟล์และเชื่อมโยงเข้ากับบัญชีลูกค้า เก็บรักษาไฟล์สำหรับการสั่งซ้ำในอนาคต
* **Output:** หมายเลขคำสั่งซื้อ (Order Number) และตัวอย่างภาพพรีวิว
* **Acceptance Criteria:**
  * Given ลูกค้าเข้าสู่หน้าสั่งทำป้าย When ลูกค้าอัปโหลดไฟล์ขนาดไม่เกินที่กำหนด Then ระบบต้องบันทึกไฟล์และแสดงภาพตัวอย่างสำเร็จ

### FR-002: ระบบคำนวณราคาตามขนาดและวัสดุอัตโนมัติ (Auto Pricing Calculator)
* **Input:** ความกว้าง (ม.), ความยาว (ม.), และประเภทวัสดุ (ไวนิล หรือ สติกเกอร์), ความหนา/ตารางเมตร
* **Processing:** ระบบคำนวณพื้นที่ (ตร.ม.) นำไปคูณกับราคาต่อตารางเมตรของวัสดุนั้นๆ พร้อมบวกค่าจัดส่งตามเงื่อนไข
* **Output:** ยอดรวมค่าใช้จ่ายเบื้องต้น (Quotation/Estimated Price) แสดงผลให้ลูกค้าเห็นทันที (24 ชม.)
* **Acceptance Criteria:**
  * Given ลูกค้าใส่ขนาด 2x3 เมตร และเลือก "ไวนิล" When กดระบบคำนวณ Then ระบบแสดงราคา 6 ตร.ม. คูณเรทราคาไวนิลทันที

### FR-003: ระบบสั่งซ้ำในคลิกเดียว (One-click Re-order)
* **Input:** รหัสคำสั่งซื้อเดิมจากประวัติของลูกค้า
* **Processing:** ระบบดึงไฟล์งาน ขนาด วัสดุ และราคาอัปเดตล่าสุดมาสร้าง Draft Order ใหม่
* **Output:** หน้าตระกร้าสินค้าที่พร้อมชำระเงินโดยไม่ต้องอัปโหลดไฟล์ใหม่
* **Acceptance Criteria:**
  * Given ลูกค้าดูประวัติงาน When กดปุ่ม Re-order ท้ายรายการ Then ระบบสร้างออเดอร์ใหม่ด้วยไฟล์เดิมให้พร้อมชำระเงิน

### FR-004: ระบบติดตามสถานะการผลิต (Order Tracking Dashboard)
* **Input:** การเปลี่ยนสถานะโดยพนักงานหรือช่างพิมพ์
* **Processing:** ระบบอัปเดตสถานะในฐานข้อมูลและส่งแจ้งเตือน (Notification / Line OA) ถึงลูกค้า
* **Output:** หน้า Dashboard ของลูกค้าแสดงสถานะ เช่น "รอยืนยัน", "กำลังพิมพ์", "พร้อมส่ง"
* **Acceptance Criteria:**
  * Given ออเดอร์อยู่ในสถานะกำลังผลิต When ช่างพิมพ์กดปรับเป็น "เสร็จสิ้น" Then Dashboard ลูกค้าจะเปลี่ยนสถานะเป็นสร้างเสร็จแล้วทันที

---

## 4. Technical Architecture & Tech Stack

เพื่อให้ระบบมีความทันสมัย ปลอดภัย และรองรับไฟล์ขนาดใหญ่ได้ดีตาม AI-Ready Standard:

### 4.1 Frontend (Client Side)
*   **Framework:** Next.js 14+ (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS + Shadcn UI (Modern & Premium Design)
*   **Icons:** Lucide React
*   **Validation:** Zod + React Hook Form

### 4.2 Backend (Server Side)
*   **Language:** Rust (Performance & Memory Safety)
*   **Web Framework:** Axum
*   **Database:** PostgreSQL/SQLite (SQLx)
*   **Authentication:** JWT (JSON Web Token) + Bcrypt Hashing
*   **Storage API:** AWS SDK for S3/R2 (Presigned URLs for Large File Uploads)

---

## 5. Order Lifecycle & Statuses

เพื่อให้การทำงานระหว่างลูกค้าและแอดมินสอดคล้องกัน ระบบกำหนดสถานะดังนี้:
1.  **Pending_Payment:** รอการแจ้งโอนเงินจากลูกค้า
2.  **Payment_Checking:** ลูกค้าส่งสลิปแล้ว รอแอดมินตรวจสอบยอดเงิน
3.  **Producing:** ยอดเงินถูกต้อง งานถูกส่งไปให้ช่างพิมพ์เริ่มผลิต
4.  **Completed:** พิมพ์งานเสร็จสิ้น พร้อมส่งมอบ
5.  **Delivered:** ส่งมอบงานให้ลูกค้าเรียบร้อยแล้ว

---

## 6. Development Strategy (Phases & Tasks)

เพื่อให้การพัฒนามีทิศทางที่ชัดเจนและวัดผลได้ ระบบจะถูกแบ่งออกเป็น 5 เฟสหลัก:

### Phase 1: Foundation & Authentication (Completed)
*   Setup Project (Next.js + Axum + DB Schema)
*   Implement JWT Auth & Middleware
*   User Registration & Login (Customer/Admin roles)

### Phase 2: Core Ordering & Storage (Completed)
*   Auto-Price Calculator (Width x Height x Material)
*   Order Creation Logic
*   S3/R2 Integration (Presigned URL for heavy print files)
*   Slip Upload Integration

### Phase 3: Dashboard & Order Tracking (In-Progress)
*   Customer Dashboard (Filter by status: All, Pending, Production, Finished)
*   Admin Dashboard (Order Management Table)
*   One-click Re-order system

### Phase 4: Admin Management (Current Focus)
*   Inventory Management (Update Materials, Change Square Meter Prices)
*   User Management (Manage Roles & Staff)


