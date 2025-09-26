# Diagram Aplikasi dalam Format PlantUML

## 1. Component Diagram - Arsitektur Sistem

```plantuml
@startuml
!define RECTANGLE class

skinparam componentStyle rectangle
skinparam backgroundColor #FEFEFE
skinparam component {
    BackgroundColor<<Frontend>> #E3F2FD
    BackgroundColor<<Backend>> #F3E5F5
    BackgroundColor<<Database>> #FFF3E0
    BackgroundColor<<External>> #E8F5E9
    BackgroundColor<<Cache>> #FFEBEE
}

package "Frontend Layer" <<Frontend>> {
    [React SPA]
    [Inertia.js]
    [Vite Dev Server]
    [Tailwind CSS]
    [TypeScript]
}

package "Backend Layer" <<Backend>> {
    [Laravel 12]
    [Controllers]
    [Models]
    [Services]
    [Middleware]
    [Queue Jobs]
}

package "Data Layer" <<Database>> {
    database "MariaDB" {
        [Master Tables]
        [Transaction Tables]
        [Audit Tables]
    }
}

package "Cache Layer" <<Cache>> {
    database "Redis" {
        [Session Store]
        [Cache Store]
        [Queue Store]
    }
}

package "External Services" <<External>> {
    [BPJS API]
    [Satu Sehat API]
    [Payment Gateway]
}

[React SPA] --> [Inertia.js]
[Inertia.js] --> [Laravel 12]
[Laravel 12] --> [Controllers]
[Controllers] --> [Services]
[Services] --> [Models]
[Models] --> [Master Tables]
[Models] --> [Transaction Tables]
[Laravel 12] --> [Session Store]
[Services] --> [Cache Store]
[Queue Jobs] --> [Queue Store]
[Services] --> [BPJS API]
[Services] --> [Satu Sehat API]
[Services] --> [Payment Gateway]

@enduml
```

## 2. Sequence Diagram - Proses Pendaftaran Pasien BPJS

```plantuml
@startuml
actor Petugas
participant "React Frontend" as React
participant "Inertia.js" as Inertia
participant "PendaftaranController" as Controller
participant "PasienService" as Service
participant "Database" as DB
participant "BPJS API" as BPJS
participant "Redis Cache" as Redis

Petugas -> React: Input Data Pasien
React -> React: Validasi Form
React -> Inertia: Submit Pendaftaran

Inertia -> Controller: POST /pendaftaran
Controller -> Service: validatePatient(data)
Service -> DB: checkExistingPatient(nik)

alt Pasien Baru
    DB --> Service: null
    Service -> Service: generateNoRM()
    Service -> DB: createPatient(data)
    DB --> Service: patientId
else Pasien Lama
    DB --> Service: patientData
end

Service -> BPJS: verifyEligibility(noBPJS)
BPJS --> Service: eligibilityStatus

alt BPJS Valid
    Service -> Redis: cacheEligibility(data)
    Service -> DB: createRegistration(data)
    DB --> Service: registrationId
    Service -> Service: generateQueueNumber()
    Service -> DB: saveQueue(queueData)
    Service --> Controller: success(registration)
else BPJS Invalid
    Service --> Controller: error("BPJS tidak valid")
end

Controller -> Inertia: response(result)
Inertia -> React: render(result)
React -> Petugas: Display Result

@enduml
```

## 3. Activity Diagram - Alur Pelayanan SOAP

```plantuml
@startuml
start

:Pasien Dipanggil dari Antrian;

if (Pemeriksaan Perawat?) then (yes)
    :Input Vital Sign;
    :Input Anamnesis;
    :Simpan SO (Subjective-Objective);
else (no)
endif

:Dokter Mulai Pemeriksaan;

:Input Subjective;
note right: Keluhan utama, RPS, RPD, RPK

:Input Objective;
note right: Pemeriksaan fisik, vital sign

:Input Assessment;
note right: Diagnosis kerja, diagnosis banding

:Input Plan;
note right: Terapi, edukasi, follow up

if (Perlu Resep?) then (yes)
    :Buat E-Prescription;
    :Pilih Obat dari Database;
    :Set Dosis & Instruksi;
endif

if (Perlu Lab/Radiologi?) then (yes)
    :Buat Permintaan Pemeriksaan;
    :Pilih Jenis Pemeriksaan;
endif

if (Perlu Tindakan?) then (yes)
    :Input Tindakan (ICD-9);
    :Set Tarif Tindakan;
endif

:Input Diagnosis (ICD-10);

if (Perlu Rujukan?) then (yes)
    :Buat Surat Rujukan;
    :Input RS Tujuan;
    :Input Alasan Rujukan;
endif

:Simpan SOAP;
:Generate Billing;
:Update Status Pasien;

stop

@enduml
```

## 4. Use Case Diagram - Sistem Informasi Klinik

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Admin" as admin
actor "Petugas Pendaftaran" as registration
actor "Perawat" as nurse
actor "Dokter" as doctor
actor "Apoteker" as pharmacist
actor "Kasir" as cashier
actor "Gudang" as warehouse
actor "Pasien" as patient

rectangle "Sistem Informasi Klinik" {
    usecase "Manage Master Data" as UC1
    usecase "Manage Users" as UC2
    usecase "Register Patient" as UC3
    usecase "Create Queue" as UC4
    usecase "SO Assessment" as UC5
    usecase "SOAP Documentation" as UC6
    usecase "E-Prescribing" as UC7
    usecase "Dispense Medicine" as UC8
    usecase "Process Payment" as UC9
    usecase "Manage Inventory" as UC10
    usecase "Purchase Order" as UC11
    usecase "Generate Reports" as UC12
    usecase "Online Registration" as UC13
    usecase "View Queue Status" as UC14
}

admin --> UC1
admin --> UC2
admin --> UC12

registration --> UC3
registration --> UC4

nurse --> UC5

doctor --> UC6
doctor --> UC7

pharmacist --> UC8

cashier --> UC9

warehouse --> UC10
warehouse --> UC11

patient --> UC13
patient --> UC14

UC3 ..> UC4 : includes
UC6 ..> UC7 : extends
UC7 ..> UC8 : includes
UC8 ..> UC9 : includes

@enduml
```

## 5. State Diagram - Status Pasien

```plantuml
@startuml
[*] --> Registered : Pendaftaran

Registered --> Queued : Generate Antrian
Queued --> Called : Panggil Pasien
Called --> NoShow : Timeout
Called --> InExamination : Pasien Datang

NoShow --> [*] : Batal

InExamination --> SOCompleted : Perawat Selesai
SOCompleted --> SOAPInProgress : Dokter Mulai
SOAPInProgress --> SOAPCompleted : SOAP Selesai

SOAPCompleted --> PrescriptionIssued : Ada Resep
SOAPCompleted --> BillingGenerated : Tanpa Resep

PrescriptionIssued --> MedicineDispensed : Obat Diserahkan
MedicineDispensed --> BillingGenerated : Generate Tagihan

BillingGenerated --> PaymentProcessing : Proses Bayar
PaymentProcessing --> PaymentCompleted : Bayar Selesai

PaymentCompleted --> [*] : Selesai

state InExamination {
    [*] --> VitalSign
    VitalSign --> Anamnesis
    Anamnesis --> PhysicalExam
    PhysicalExam --> [*]
}

state SOAPInProgress {
    [*] --> Subjective
    Subjective --> Objective
    Objective --> Assessment
    Assessment --> Plan
    Plan --> [*]
}

@enduml
```

## 6. Deployment Diagram

```plantuml
@startuml
node "Client Devices" {
    [Web Browser]
    [Mobile Browser]
}

node "Web Server" {
    [Nginx/Apache]
    [Vite Dev Server]
}

node "Application Server" {
    [Laravel Application]
    [Queue Workers]
    [Scheduler]
}

node "Database Server" {
    database "MariaDB" {
        [Primary Database]
    }
}

node "Cache Server" {
    database "Redis" {
        [Session Storage]
        [Cache Storage]
        [Queue Storage]
    }
}

node "File Storage" {
    [Local Storage]
    [Backup Storage]
}

cloud "External Services" {
    [BPJS Services]
    [Satu Sehat API]
    [Payment Gateway]
}

[Web Browser] --> [Nginx/Apache] : HTTPS
[Mobile Browser] --> [Nginx/Apache] : HTTPS
[Nginx/Apache] --> [Laravel Application] : FastCGI
[Vite Dev Server] --> [Laravel Application] : WebSocket
[Laravel Application] --> [Primary Database] : MySQL Protocol
[Laravel Application] --> [Session Storage] : Redis Protocol
[Laravel Application] --> [Cache Storage] : Redis Protocol
[Queue Workers] --> [Queue Storage] : Redis Protocol
[Laravel Application] --> [Local Storage] : File System
[Laravel Application] --> [BPJS Services] : REST API
[Laravel Application] --> [Satu Sehat API] : REST API
[Laravel Application] --> [Payment Gateway] : REST API

@enduml
```

## 7. Class Diagram - Core Models

```plantuml
@startuml
class Pasien {
    - id: bigint
    - uuid: string
    - no_rm: string
    - nik: string
    - nama: string
    - tempat_lahir: string
    - tanggal_lahir: date
    - no_bpjs: string
    - alamat: text
    - telepon: string
    + register()
    + verify()
    + updateData()
}

class Dokter {
    - id: bigint
    - nama: string
    - nik: string
    - poli: string
    - sip: string
    - str: string
    - npwp: string
    + createSchedule()
    + updateCredentials()
}

class Pendaftaran {
    - id: bigint
    - nomor_rm: string
    - pasien_id: bigint
    - nomor_register: string
    - tanggal_kunjungan: date
    - poli_id: bigint
    - dokter_id: bigint
    - penjamin: string
    - antrian: string
    - status: string
    + create()
    + generateQueue()
    + cancel()
}

class Pelayanan {
    - id: bigint
    - nomor_register: string
    - pasien_id: bigint
    - poli_id: bigint
    - dokter_id: bigint
    - status: string
    + startService()
    + completeService()
}

class PelayananSO {
    - id: bigint
    - no_rawat: string
    - subjective: text
    - objective: text
    - vital_sign: json
    + save()
    + update()
}

class PelayananSOAP {
    - id: bigint
    - no_rawat: string
    - subjective: text
    - objective: text
    - assessment: text
    - plan: text
    - dokter_id: bigint
    + save()
    + addDiagnosis()
    + addPrescription()
}

class Kasir {
    - id: bigint
    - kode_faktur: string
    - no_rawat: string
    - no_rm: string
    - total: decimal
    - payment_method: string
    + processPayment()
    + printReceipt()
}

class DaftarBarang {
    - id: bigint
    - kode_barang: string
    - nama_barang: string
    - kategori: string
    - harga_jual: decimal
    - stok: integer
    + updateStock()
    + checkAvailability()
}

Pasien "1" --> "0..*" Pendaftaran
Dokter "1" --> "0..*" Pendaftaran
Pendaftaran "1" --> "1" Pelayanan
Pelayanan "1" --> "0..1" PelayananSO
Pelayanan "1" --> "0..1" PelayananSOAP
Pelayanan "1" --> "0..1" Kasir
PelayananSOAP "1" --> "0..*" DaftarBarang : prescribes

@enduml
```

## Cara Menggunakan Diagram PlantUML

### Online Tools:
1. **PlantUML Online Server**: http://www.plantuml.com/plantuml/uml/
2. **PlantText**: https://www.planttext.com/
3. **Draw.io**: https://app.diagrams.net/ (support PlantUML)

### VS Code Extensions:
1. Install "PlantUML" extension
2. Install Java (required for local rendering)
3. Use `Alt+D` to preview diagram

### Export Options:
- PNG
- SVG
- PDF
- LaTeX

### Integration:
- Dapat di-embed di dokumentasi Markdown
- Support di GitLab/GitHub dengan PlantUML renderer
- Dapat di-integrate dengan CI/CD untuk auto-generate diagram

---

*Semua diagram di atas dapat di-render menggunakan PlantUML processor. Copy kode di antara \`\`\`plantuml dan \`\`\` ke PlantUML renderer untuk visualisasi.*
