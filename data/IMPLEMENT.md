# Implementation Guide (IMPLEMENT.md)
**ชื่อโปรเจกต์:** ระบบจัดการร้านบริการพิมพ์ป้ายไวนิล (กลุ่มไผ่อวบหรอ?)
**อ้างอิงจาก:** Software Requirements Specification (SRS) v1.0.0

เอกสารฉบับนี้จัดทำขึ้นเพื่อเป็นแนวทางสำหรับนักพัฒนาในการขึ้นโครงสร้างโปรเจกต์ เทคโนโลยีที่เลือกใช้ การออกแบบฐานข้อมูล และการจัดการ API สำหรับระบบจัดการร้านบริการพิมพ์ป้ายไวนิล

---

## 1. Tech Stack (เทคโนโลยีที่ใช้)

### Frontend (Application & Dashboard)
* **Framework:** Next.js (App Router แนะนำให้ใช้เวอร์ชันล่าสุด >= 14)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **UI Components:** shadcn/ui (เพื่อความรวดเร็วและเป็นมาตรฐาน)
* **State Management & Data Fetching:** React Query หรือ SWR
* **Deployment:** Vercel หรือ Dockerized Web App

### Backend (API Server & Business Logic)
* **Framework:** Rust (Axum) - เพื่อประสิทธิภาพการทำงานสูงสุด (High Performance & Memory Safety)
* **Language:** Rust (เวอร์ชันเสถียรล่าสุด)
* **Database Driver / ORM:** SQLx หรือ SeaORM (สำหรับการจัดการฐานข้อมูลด้วย Rust แบบ Asynchronous)
* **Serialization/Deserialization:** `serde` และ `serde_json`
* **Authentication:** JWT (JSON Web Tokens)
* **Deployment:** Docker Container, AWS EC2 หรือ DigitalOcean Droplet

### Database
* **Relational Database:** PostgreSQL (เพื่อรองรับโครงสร้างข้อมูลที่ซับซ้อนและ JSONB สำหรับไฟล์/สเปคสินค้า)

---

## 2. Database Schema (Schema เบื้องต้น)

โครงสร้างฐานข้อมูลเบื้องต้นสำหรับจัดการคลังสินค้า (Inventory) และคำสั่งซื้อ (Orders)

### 2.1 Table: `inventory` (คลังวัสดุ)
เก็บข้อมูลวัสดุที่ร้านมีให้บริการ สำหรับใช้ในการคำนวณราคาและตัวเลือกให้ลูกค้า
* `id` (UUID, Primary Key)
* `material_type` (VARCHAR) - เช่น 'Vinyl', 'Sticker_Clear', 'Sticker_Matte'
* `base_price_per_sqm` (DECIMAL) - ราคาตั้งต้นต่อตารางเมตร
* `stock_quantity` (DECIMAL) - ปริมาณที่มีในคลัง (ม้วน/ตารางเมตร)
* `is_active` (BOOLEAN) - เปิด/ปิดการใช้งานวัสดุนี้
* `created_at` (TIMESTAMP)
* `updated_at` (TIMESTAMP)

### 2.2 Table: `orders` (รายการคำสั่งซื้อ)
เก็บข้อมูลคำสั่งซื้อของลูกค้า การอ้างอิงไฟล์ และสถานะงานพิมพ์
* `id` (UUID, Primary Key)
* `customer_id` (UUID, Foreign Key) - เชื่อมโยงกับตาราง Users/Customers (ไม่ได้แสดงในนี้)
* `material_id` (UUID, Foreign Key) - เชื่อมกับ `inventory.id`
* `width_m` (DECIMAL) - ความกว้าง (เมตร)
* `height_m` (DECIMAL) - ความสูง (เมตร)
* `total_sqm` (DECIMAL) - พื้นที่รวม (ตารางเมตร)
* `file_url` (VARCHAR) - ลิงก์เก็บไฟล์งานพิมพ์ (เช่น S3 Bucket URL หรือ Supabase Storage)
* `estimated_price` (DECIMAL) - ราคาประเมิน
* `status` (VARCHAR) - สถานะคำสั่งซื้อ (เช่น 'Pending_Payment', 'Producing', 'Completed', 'Delivered')
* `created_at` (TIMESTAMP)
* `updated_at` (TIMESTAMP)

> **หมายเหตุ:** ในการทำ Re-order สามารถคัดลอกข้อมูลจาก `orders` เดิมที่ลูกค้าเคยสั่ง และสร้าง Transaction ใหม่ได้ทันทีโดยอิง `file_url` เดิม

---

## 3. API Endpoints (รายการ API เบื้องต้น)

รายการ RESTful API พื้นฐานสำหรับการดำเนินการของระบบ:

### 3.1 Calculator API
* **`POST /api/calculator`**
  * **Description:** คำนวณราคาประเมินเบื้องต้นจากขนาดและวัสดุ
  * **Request Body:** `{ "width_m": 2.0, "height_m": 3.0, "material_id": "uuid..." }`
  * **Response:** `{ "total_sqm": 6.0, "estimated_price": 900.00 }`

### 3.2 Orders API
* **`POST /api/orders`**
  * **Description:** สร้างคำสั่งซื้อใหม่ (หรือรับ Re-order)
  * **Request Body:** `{ "customer_id": "...", "material_id": "...", "width_m": 2, "height_m": 3, "file_url": "..." }`
  * **Response (201):** `{ "order_id": "uuid", "status": "Pending_Payment" }`
* **`GET /api/orders`**
  * **Description:** ดึงรายการคำสั่งซื้อ (สามารถใส่ Query ?customer_id=... สำหรับลูกค้า หรือไม่ใส่เพื่อดึงทั้งหมดสำหรับ Admin)
* **`GET /api/orders/:id`**
  * **Description:** ดูรายละเอียดคำสั่งซื้อเฉพาะรายการ
* **`PATCH /api/orders/:id/status`**
  * **Description:** อัปเดตสถานะการผลิตโดยพนักงาน หรือOperator
  * **Request Body:** `{ "status": "Producing" }`

### 3.3 Inventory API
* **`GET /api/inventory`**
  * **Description:** ดึงรายการวัสดุและราคาตั้งต้นเพื่อแสดงผลที่หน้าเว็บ (Frontend dropdown options)

---

## 4. Project Structure (โครงสร้างโฟลเดอร์)

การเสนอโครงสร้างโฟลเดอร์สำหรับ Workspace ทั่วไป ซึ่งแบ่งเป็นฝั่ง Frontend (Next.js) และ Backend (Rust) อย่างชัดเจน (Monorepo-style หรือแบ่งแยก Repository ตามความถนัด)

```text
d:\Work\VINYL\
├── srs.md                           # ไฟล์เอกสาร Requirements (SRS)
├── implement.md                     # ไฟล์เอกสารนีั (Implementation Guide)
│
├── frontend/                        # ฝั่ง Frontend: Next.js + Tailwind CSS
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── src/
│   │   ├── app/                     # Next.js App Router (Pages & API Routes)
│   │   │   ├── (auth)/              # หน้า Login/Register
│   │   │   ├── dashboard/           # หน้า Dashboard ลูกค้า/พนักงาน
│   │   │   ├── order/               # หน้าสั่งทำป้าย, อัปโหลดไฟล์, เลือกวัสดุ
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx             # หน้าแรก (Landing Page)
│   │   ├── components/              # Reusable UI Components (ปุ่ม, ฟอร์ม, ตาราง)
│   │   │   └── ui/                  # Component จาก shadcn/ui
│   │   ├── lib/                     # Utiliy functions
│   │   ├── services/                # API client functions (คุยกับ Rust Backend)
│   │   └── types/                   # TypeScript interfaces สำหรับ Request/Response
│
└── backend/                         # ฝั่ง Backend: Rust + Axum
    ├── Cargo.toml
    ├── .env                         # ตัวแปรสภาพแวดล้อมระบบ (Database URL, JWT Secret)
    ├── migrations/                  # ไฟล์ SQL Migration สำหรับสร้างตาราง (sqlx)
    └── src/
        ├── main.rs                  # จุดเริ่มต้น Application และการตั้งค่า Server
        ├── config.rs                # จัดการ Environment variables
        ├── db.rs                    # ฟังก์ชันเชื่อมต่อ Database
        ├── handlers/                # Controllers (รับ Request, ประมวลผล, ส่ง Response)
        │   ├── calculator.rs
        │   ├── inventory.rs
        │   └── orders.rs
        ├── models/                  # Structs ที่ Map กับ Database Tables
        │   ├── inventory.rs
        │   └── orders.rs
        ├── routes/                  # รวม Axum Router และการจับคู่ Endpoints
        └── utils/                   # ฟังก์ชัน Helper เช่น การจัดการ JWT, การจัดการ Errors
```
