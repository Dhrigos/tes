# Dokumentasi Aplikasi Sistem Informasi Klinik/Rumah Sakit

## 1. RINGKASAN STRUKTUR APLIKASI

### 1.1 Teknologi Stack

#### **Backend (Laravel 12)**
- **Framework**: Laravel 12 (PHP 8.2+)
- **Database**: MariaDB/MySQL
- **Cache & Session**: Redis
- **Queue**: Redis
- **Authentication**: Laravel Sanctum
- **Permission**: Spatie Laravel Permission
- **Monitoring**: Laravel Pulse & Telescope
- **PDF Generation**: Laravel DomPDF
- **Excel Export**: Maatwebsite Excel
- **Barcode**: Picqer PHP Barcode Generator

#### **Frontend (React + Vite)**
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **SSR**: Inertia.js
- **UI Components**: 
  - Radix UI (Dialog, Select, Dropdown, etc.)
  - Headless UI
  - Lucide React Icons
- **Styling**: Tailwind CSS 4 + Tailwind Animate
- **Form & Validation**: React Hook Form (implied)
- **Notifications**: Sonner
- **Date Handling**: date-fns
- **Animation**: Framer Motion + Lottie React

#### **Database**
- **Primary**: MariaDB/MySQL
- **Cache**: Redis
- **Regional Data**: Laravolt Indonesia (Provinsi, Kabupaten, Kecamatan, Desa)

#### **External Integration**
- **BPJS**: API Integration (PCare & Antrian FKTP)
- **Satu Sehat**: Kementerian Kesehatan API

### 1.2 Struktur Direktori

```
apps-dev/
├── app/                    # Backend Laravel
│   ├── Console/           # Command line tools
│   ├── Events/            # Event handlers
│   ├── Exports/           # Excel export classes
│   ├── Http/
│   │   ├── Controllers/   # API & Web Controllers
│   │   │   ├── Module/    # Business logic controllers
│   │   │   │   ├── Antrian/
│   │   │   │   ├── Apotek/
│   │   │   │   ├── Gudang/
│   │   │   │   ├── Kasir/
│   │   │   │   ├── Laporan/
│   │   │   │   ├── Master/
│   │   │   │   ├── Pasien/
│   │   │   │   ├── Pelayanan/
│   │   │   │   ├── Pembelian/
│   │   │   │   ├── Pendaftaran/
│   │   │   │   └── SDM/
│   │   ├── Middleware/
│   │   └── Requests/      # Form validation
│   └── Models/            # Eloquent models
├── database/
│   ├── migrations/        # Database schema (130+ tables)
│   └── seeders/          # Initial data
├── resources/
│   ├── js/               # React Frontend
│   │   ├── components/   # Reusable components
│   │   ├── hooks/        # Custom React hooks
│   │   └── pages/        # Page components
│   │       └── module/   # Business modules
│   └── views/            # Blade templates
├── routes/               # Application routing
│   ├── web.php          # Main web routes
│   ├── api.php          # API routes
│   └── auth.php         # Authentication routes
└── storage/             # File storage
```

### 1.3 Modul-Modul Utama

#### **1. Modul Master Data**
- **Data Umum**: Agama, Asuransi, Bahasa, Golongan Darah, Bank, Kelamin, Loket, Pekerjaan, Pendidikan, Penjamin, Pernikahan, Suku
- **Data Manajemen**: Posisi Kerja (Posker)
- **Data Medis**: 
  - Alergi, ICD-10, ICD-9
  - HTT (Pemeriksaan & Sub-pemeriksaan)
  - Laboratorium (Bidang & Sub-bidang)
  - Radiologi
  - Poli, Spesialis, Sub-spesialis
  - Tindakan & Kategori Tindakan
  - Instruksi & Penggunaan Obat
  - Jenis Diet & Makanan
- **Data Gudang**: 
  - Kategori & Satuan Barang
  - Supplier
  - Daftar Barang & Harga Jual

#### **2. Modul SDM (Sumber Daya Manusia)**
- Manajemen Dokter (dengan jadwal praktik)
- Manajemen Perawat/Bidan
- Manajemen Staff
- Verifikasi kredensial (SIP, STR, SPRI)

#### **3. Modul Pasien**
- Registrasi pasien baru
- Verifikasi data pasien
- Integrasi BPJS
- Manajemen No. RM (Rekam Medis)

#### **4. Modul Pendaftaran**
- Pendaftaran offline
- Pendaftaran online
- Sistem antrian
- Penjadwalan kunjungan

#### **5. Modul Pelayanan**
- **SO Perawat**: Subjective-Objective assessment
- **SOAP Dokter**: Full SOAP documentation
- **SOAP Bidan**: Specialized for midwifery
- Rujukan
- Permintaan pemeriksaan

#### **6. Modul Gudang**
- Stok Barang (Obat & Inventaris)
- Stok per Klinik
- Permintaan Barang
- Pengeluaran Barang
- Penyesuaian Stok

#### **7. Modul Pembelian**
- Purchase Order
- Penerimaan Barang
- Retur Pembelian

#### **8. Modul Apotek**
- Resep elektronik
- Dispensing
- Stok obat

#### **9. Modul Kasir**
- Billing
- Multi-payment method
- Cetak kwitansi

#### **10. Modul Laporan**
- Laporan kunjungan
- Laporan keuangan
- Laporan stok
- Export Excel/PDF

#### **11. Modul Antrian**
- Display antrian
- Pemanggilan pasien
- Monitor antrian

## 2. ALUR DATA ANTAR KOMPONEN

### 2.1 Request → Processing → Response Flow

```
[Browser/Client]
      ↓ HTTP Request
[Vite Dev Server] → [Laravel Server]
      ↓                    ↓
[React Components]   [Route Handler]
      ↓                    ↓
[Inertia.js]        [Controller]
      ↓                    ↓
[API Calls]          [Service/Model]
      ↓                    ↓
                     [Database]
                           ↓
                     [Redis Cache]
                           ↓
                     [Response Builder]
                           ↓
[Inertia Response] ← [JSON Response]
      ↓
[React Re-render]
      ↓
[UI Update]
```

### 2.2 Authentication Flow

```
Login Request → Sanctum Auth → Session Creation → Redis Storage → Authenticated State
```

### 2.3 Data Synchronization

```
Local Data → Queue Job → External API (BPJS/Satu Sehat) → Response → Update Local DB
```

## 3. DIAGRAM ARSITEKTUR APLIKASI

```mermaid
graph TB
    subgraph "Client Layer"
        A[Browser/Mobile]
        B[React SPA]
        C[Inertia.js]
    end
    
    subgraph "Presentation Layer"
        D[Vite Dev Server]
        E[Laravel Web Routes]
        F[API Routes]
    end
    
    subgraph "Application Layer"
        G[Controllers]
        H[Middleware]
        I[Form Requests]
        J[Events & Listeners]
    end
    
    subgraph "Business Logic Layer"
        K[Services]
        L[Models]
        M[Repositories]
        N[Jobs/Queues]
    end
    
    subgraph "Data Layer"
        O[(MariaDB/MySQL)]
        P[(Redis Cache)]
        Q[File Storage]
    end
    
    subgraph "External Services"
        R[BPJS API]
        S[Satu Sehat API]
        T[Payment Gateway]
    end
    
    A --> B
    B <--> C
    C <--> D
    D <--> E
    A --> F
    E --> G
    F --> G
    G --> H
    H --> I
    G --> K
    K --> L
    L --> M
    K --> N
    M --> O
    K --> P
    G --> Q
    N --> R
    N --> S
    K --> T
    
    style A fill:#e1f5fe
    style B fill:#e1f5fe
    style C fill:#e1f5fe
    style O fill:#fff3e0
    style P fill:#fff3e0
    style R fill:#f3e5f5
    style S fill:#f3e5f5
```

## 4. FLOWCHART PROSES UTAMA

### 4.1 Proses Login

```mermaid
flowchart TD
    Start([Start]) --> Input[Input Username & Password]
    Input --> Validate{Validasi Input}
    Validate -->|Invalid| Error1[Tampilkan Error]
    Error1 --> Input
    Validate -->|Valid| Auth[Authenticate via Sanctum]
    Auth --> Check{Credentials Valid?}
    Check -->|No| Error2[Invalid Credentials]
    Error2 --> Input
    Check -->|Yes| Session[Create Session]
    Session --> Redis[Store in Redis]
    Redis --> Role[Check User Role]
    Role --> Dashboard[Redirect to Dashboard]
    Dashboard --> End([End])
    
    style Start fill:#e8f5e9
    style End fill:#e8f5e9
    style Error1 fill:#ffebee
    style Error2 fill:#ffebee
```

### 4.2 Proses Pendaftaran Pasien

```mermaid
flowchart TD
    Start([Start]) --> Type{Tipe Pendaftaran}
    Type -->|Baru| NewForm[Form Pasien Baru]
    Type -->|Lama| Search[Cari Pasien]
    
    NewForm --> InputData[Input Data Pasien]
    InputData --> ValidateNew{Validasi Data}
    ValidateNew -->|Invalid| ErrorNew[Tampilkan Error]
    ErrorNew --> InputData
    ValidateNew -->|Valid| CheckNIK{Cek NIK Existing}
    CheckNIK -->|Ada| Existing[Gunakan Data Existing]
    CheckNIK -->|Tidak Ada| CreateRM[Generate No. RM]
    
    Search --> Found{Pasien Ditemukan?}
    Found -->|No| NewForm
    Found -->|Yes| SelectPatient[Pilih Pasien]
    
    CreateRM --> SavePatient[Simpan Data Pasien]
    SelectPatient --> Existing
    Existing --> SelectPoli[Pilih Poli]
    SavePatient --> SelectPoli
    
    SelectPoli --> SelectDoctor[Pilih Dokter]
    SelectDoctor --> SelectPenjamin[Pilih Penjamin]
    SelectPenjamin --> CheckBPJS{BPJS?}
    CheckBPJS -->|Yes| VerifyBPJS[Verifikasi BPJS]
    CheckBPJS -->|No| CreateQueue[Buat Antrian]
    VerifyBPJS --> BPJSValid{Valid?}
    BPJSValid -->|No| ErrorBPJS[Error BPJS]
    ErrorBPJS --> SelectPenjamin
    BPJSValid -->|Yes| CreateQueue
    
    CreateQueue --> SaveRegistration[Simpan Pendaftaran]
    SaveRegistration --> PrintQueue[Cetak Nomor Antrian]
    PrintQueue --> End([End])
    
    style Start fill:#e8f5e9
    style End fill:#e8f5e9
    style ErrorNew fill:#ffebee
    style ErrorBPJS fill:#ffebee
```

### 4.3 Proses Pelayanan (SOAP)

```mermaid
flowchart TD
    Start([Start]) --> Queue[Ambil dari Antrian]
    Queue --> CallPatient[Panggil Pasien]
    CallPatient --> Nurse{Perawat/Bidan?}
    
    Nurse -->|Perawat| NurseAssess[SO Assessment]
    NurseAssess --> VitalSign[Input Vital Sign]
    VitalSign --> Anamnesis[Anamnesis]
    Anamnesis --> SaveSO[Simpan SO]
    
    Nurse -->|Skip| Doctor
    SaveSO --> Doctor[Dokter Assessment]
    
    Doctor --> Subjective[Input Subjective]
    Subjective --> Objective[Input Objective]
    Objective --> Assessment[Input Assessment]
    Assessment --> Plan[Input Plan]
    
    Plan --> Prescription{Resep Obat?}
    Prescription -->|Yes| InputMeds[Input Obat]
    Prescription -->|No| Lab{Lab/Radiologi?}
    
    InputMeds --> Lab
    Lab -->|Yes| LabRequest[Buat Permintaan]
    Lab -->|No| Diagnosis[Input Diagnosis ICD-10]
    LabRequest --> Diagnosis
    
    Diagnosis --> Procedure{Tindakan?}
    Procedure -->|Yes| InputProcedure[Input Tindakan ICD-9]
    Procedure -->|No| Referral{Rujukan?}
    InputProcedure --> Referral
    
    Referral -->|Yes| CreateReferral[Buat Rujukan]
    Referral -->|No| SaveSOAP[Simpan SOAP]
    CreateReferral --> SaveSOAP
    
    SaveSOAP --> Billing[Generate Billing]
    Billing --> End([End])
    
    style Start fill:#e8f5e9
    style End fill:#e8f5e9
```

### 4.4 Proses Kasir/Pembayaran

```mermaid
flowchart TD
    Start([Start]) --> Search[Cari Pasien/No. Rawat]
    Search --> Found{Data Ditemukan?}
    Found -->|No| Error[Data Tidak Ditemukan]
    Error --> Search
    Found -->|Yes| LoadBill[Load Tagihan]
    
    LoadBill --> DisplayBill[Tampilkan Rincian]
    DisplayBill --> Discount{Ada Diskon?}
    Discount -->|Yes| ApplyDiscount[Apply Diskon]
    Discount -->|No| Admin
    ApplyDiscount --> Admin[Biaya Admin]
    
    Admin --> Materai{Perlu Materai?}
    Materai -->|Yes| AddMaterai[Tambah Materai]
    Materai -->|No| Total
    AddMaterai --> Total[Hitung Total]
    
    Total --> PayMethod[Pilih Metode Bayar]
    PayMethod --> MultiPay{Multi Payment?}
    
    MultiPay -->|No| SinglePay[Input Nominal]
    MultiPay -->|Yes| Payment1[Payment Method 1]
    Payment1 --> Payment2{Payment 2?}
    Payment2 -->|Yes| InputPay2[Input Payment 2]
    Payment2 -->|No| Calculate
    InputPay2 --> Payment3{Payment 3?}
    Payment3 -->|Yes| InputPay3[Input Payment 3]
    Payment3 -->|No| Calculate
    InputPay3 --> Calculate
    
    SinglePay --> Calculate[Hitung Kembalian]
    Calculate --> Validate{Pembayaran Cukup?}
    Validate -->|No| Insufficient[Pembayaran Kurang]
    Insufficient --> PayMethod
    Validate -->|Yes| SavePayment[Simpan Transaksi]
    
    SavePayment --> PrintReceipt[Cetak Kwitansi]
    PrintReceipt --> UpdateStatus[Update Status Pasien]
    UpdateStatus --> End([End])
    
    style Start fill:#e8f5e9
    style End fill:#e8f5e9
    style Error fill:#ffebee
    style Insufficient fill:#ffebee
```

## 5. ERD (ENTITY RELATIONSHIP DIAGRAM)

```mermaid
erDiagram
    PASIEN {
        bigint id PK
        string uuid
        string no_rm UK
        string nik
        string nama
        string tempat_lahir
        date tanggal_lahir
        string no_bpjs
        string alamat
        string telepon
        string provinsi_kode FK
        string kabupaten_kode FK
        string kecamatan_kode FK
        string desa_kode FK
    }
    
    DOKTER {
        bigint id PK
        string nama
        string nik
        string poli FK
        string npwp
        string kode
        string sip
        string str
        date tgl_masuk
        string telepon
    }
    
    PENDAFTARAN {
        bigint id PK
        string nomor_rm FK
        string pasien_id FK
        string nomor_register UK
        date tanggal_kujungan
        string poli_id FK
        string dokter_id FK
        string penjamin
        string antrian
        string status
    }
    
    PELAYANAN {
        bigint id PK
        string nomor_rm FK
        string pasien_id FK
        string nomor_register FK
        date tanggal_kujungan
        string poli_id FK
        string dokter_id FK
        string kunjungan
        string status
    }
    
    PELAYANAN_SO {
        bigint id PK
        string no_rawat FK
        text subjective
        text objective
        string tensi
        string suhu
        string nadi
        string respirasi
        string tinggi_badan
        string berat_badan
    }
    
    PELAYANAN_SOAP {
        bigint id PK
        string no_rawat FK
        text subjective
        text objective
        text assessment
        text plan
        string dokter_id FK
    }
    
    PELAYANAN_SOAP_ICD {
        bigint id PK
        string no_rawat FK
        string icd10_kode FK
        string icd9_kode FK
        string jenis_diagnosa
    }
    
    KASIR {
        bigint id PK
        string kode_faktur UK
        string no_rawat FK
        string no_rm FK
        string nama
        string poli
        string dokter
        string penjamin
        decimal sub_total
        decimal potongan_harga
        decimal total
        string payment_method_1
        decimal payment_nominal_1
    }
    
    KASIR_DETAIL {
        bigint id PK
        string kode_faktur FK
        string jenis_item
        string kode_item
        string nama_item
        int jumlah
        decimal harga_satuan
        decimal sub_total
    }
    
    DAFTAR_BARANG {
        bigint id PK
        string kode_barang UK
        string nama_barang
        string kategori_id FK
        string satuan_id FK
        string jenis
        decimal harga_beli
        decimal harga_jual
    }
    
    STOK_BARANG {
        bigint id PK
        string kode_barang FK
        string batch_number
        date expired_date
        int stok_awal
        int stok_masuk
        int stok_keluar
        int stok_akhir
    }
    
    PEMBELIAN {
        bigint id PK
        string no_faktur UK
        string supplier_id FK
        date tanggal_pembelian
        decimal total_pembelian
        string status
    }
    
    PEMBELIAN_DETAIL {
        bigint id PK
        string no_faktur FK
        string kode_barang FK
        int jumlah
        decimal harga_satuan
        decimal sub_total
    }
    
    POLI {
        bigint id PK
        string kode_poli UK
        string nama_poli
        string kode_bpjs
    }
    
    ICD10 {
        bigint id PK
        string kode UK
        string nama_diagnosa
        string kategori
    }
    
    PASIEN ||--o{ PENDAFTARAN : "mendaftar"
    PASIEN ||--o{ PELAYANAN : "dilayani"
    DOKTER ||--o{ PENDAFTARAN : "menangani"
    DOKTER ||--o{ PELAYANAN : "melayani"
    PENDAFTARAN ||--|| PELAYANAN : "menjadi"
    PELAYANAN ||--o{ PELAYANAN_SO : "memiliki"
    PELAYANAN ||--o{ PELAYANAN_SOAP : "memiliki"
    PELAYANAN_SOAP ||--o{ PELAYANAN_SOAP_ICD : "diagnosis"
    PELAYANAN ||--o{ KASIR : "dibayar"
    KASIR ||--o{ KASIR_DETAIL : "memiliki"
    DAFTAR_BARANG ||--o{ STOK_BARANG : "memiliki"
    DAFTAR_BARANG ||--o{ PEMBELIAN_DETAIL : "dibeli"
    PEMBELIAN ||--o{ PEMBELIAN_DETAIL : "memiliki"
    POLI ||--o{ PENDAFTARAN : "tujuan"
    ICD10 ||--o{ PELAYANAN_SOAP_ICD : "digunakan"
```

## 6. NARASI STEP-BY-STEP UNTUK PRESENTASI

### **Slide 1: Overview Sistem**
"Sistem Informasi Klinik ini adalah aplikasi terintegrasi yang dibangun dengan teknologi modern. Backend menggunakan Laravel 12 dengan PHP 8.2, frontend React 19 dengan TypeScript, dan database MariaDB. Sistem ini sudah terintegrasi dengan BPJS dan Satu Sehat Kementerian Kesehatan."

### **Slide 2: Arsitektur Aplikasi**
"Arsitektur aplikasi menggunakan pattern MVC dengan tambahan Service Layer. Frontend dan backend terhubung melalui Inertia.js yang memungkinkan SPA behavior tanpa perlu API terpisah. Redis digunakan untuk caching dan session management, meningkatkan performa hingga 10x lipat."

### **Slide 3: Modul-Modul Utama**
"Sistem memiliki 11 modul utama yang saling terintegrasi:
1. Master Data - mengelola semua data referensi
2. SDM - manajemen dokter, perawat, dan staff
3. Pasien - registrasi dan verifikasi pasien
4. Pendaftaran - online dan offline dengan sistem antrian
5. Pelayanan - SOAP documentation lengkap
6. Gudang - inventory management
7. Pembelian - procurement system
8. Apotek - e-prescribing
9. Kasir - billing dengan multi-payment
10. Laporan - comprehensive reporting
11. Antrian - queue management system"

### **Slide 4: Alur Pendaftaran Pasien**
"Proses dimulai dari pendaftaran, bisa online atau offline. Pasien baru akan dibuatkan nomor RM otomatis. Untuk pasien BPJS, sistem akan verifikasi eligibilitas secara real-time. Setelah pendaftaran, pasien mendapat nomor antrian yang bisa dipantau melalui display monitor."

### **Slide 5: Alur Pelayanan Medis**
"Pelayanan dimulai dari perawat melakukan assessment awal (Subjective-Objective), mencatat vital sign. Kemudian dokter melakukan pemeriksaan lengkap dengan metode SOAP. Dokter bisa membuat resep elektronik, permintaan lab/radiologi, atau rujukan. Semua terintegrasi dengan ICD-10 untuk diagnosis dan ICD-9 untuk prosedur."

### **Slide 6: Sistem Pembayaran**
"Kasir menerima tagihan otomatis dari pelayanan. Sistem mendukung multi-payment method - bisa kombinasi cash, debit, kredit, atau asuransi. Setiap transaksi tercatat lengkap dengan audit trail. Kwitansi dicetak otomatis dengan barcode untuk tracking."

### **Slide 7: Inventory Management**
"Sistem gudang terintegrasi dari pembelian hingga pengeluaran. Stok tracking per batch dengan expired date monitoring. Ada sistem permintaan barang antar unit dengan approval workflow. Stok opname bisa dilakukan dengan fitur penyesuaian stok."

### **Slide 8: Reporting & Analytics**
"Dashboard real-time menampilkan statistik kunjungan, revenue, dan KPI lainnya. Laporan bisa di-export ke Excel atau PDF. Terintegrasi dengan Laravel Pulse untuk system monitoring dan performance metrics."

### **Slide 9: Security & Compliance**
"Sistem menggunakan Laravel Sanctum untuk authentication, Spatie untuk role-based access control. Data pasien terenkripsi, session management via Redis dengan auto-timeout. Compliance dengan standar BPJS dan Satu Sehat untuk interoperabilitas."

### **Slide 10: Keunggulan Sistem**
"1. Full integration - semua modul terhubung seamless
2. Real-time sync dengan BPJS dan Satu Sehat
3. Mobile responsive design
4. Offline capability dengan queue system
5. Scalable architecture - siap untuk multi-branch
6. Comprehensive audit trail
7. Customizable per kebutuhan klinik"

## 7. INFORMASI TEKNIS TAMBAHAN

### Database Statistics
- Total Tables: 130+ tables
- Regional Data: 83,000+ records (Provinsi, Kabupaten, Kecamatan, Desa)
- Master Data: 50+ reference tables
- Transaction Tables: 30+ tables
- Audit Tables: Included in each module

### API Endpoints
- Web Routes: 450+ routes
- API Routes: 50+ endpoints
- Authentication: Session-based with Redis
- Rate Limiting: Configured per endpoint

### Performance Optimization
- Redis Caching: Session, Cache, Queue
- Database Indexing: All foreign keys and search fields
- Lazy Loading: Implemented in React components
- Code Splitting: Via Vite dynamic imports
- Image Optimization: WebP format support

### Development Tools
- Hot Module Replacement (HMR) via Vite
- Laravel Telescope for debugging
- Laravel Pail for log monitoring
- Concurrent development server (Queue, Logs, Vite)
- TypeScript for type safety
- ESLint & Prettier for code quality

### Deployment Considerations
- Docker support via Laravel Sail
- Environment-based configuration
- Queue workers for background jobs
- Scheduled tasks for maintenance
- Backup strategies for database and files

---

*Dokumentasi ini dibuat berdasarkan analisis kode sumber aplikasi. Untuk informasi lebih detail tentang modul tertentu, silakan merujuk ke dokumentasi teknis masing-masing modul.*
