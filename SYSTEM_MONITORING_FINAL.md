# System Monitoring - Final Documentation

## 🎯 Sistem Monitoring Auto-Start

Sistem monitoring yang berjalan otomatis tanpa perlu artisan command atau crontab, mengirimkan data dari database Telescope dan Pulse ke API eksternal setiap 1 menit sekali.

## ✅ File yang Dibuat

### Core Files

```
app/Services/SystemDataService.php                    - Service untuk data collection & API calls
app/Services/SimpleSystemMonitoringService.php        - Simple monitoring service
app/Http/Middleware/SystemMonitoringMiddleware.php    - Middleware untuk trigger otomatis
app/Providers/SystemMonitoringServiceProvider.php     - Service provider untuk auto-start
app/Jobs/SendSystemDataJob.php                        - Queue job untuk background processing
app/Http/Controllers/SystemMonitoringController.php   - Controller untuk API endpoints
app/Console/Commands/SendSystemDataCommand.php        - Command untuk manual execution
config/system-monitoring.php                          - Konfigurasi sistem
```

### Updated Files

```
bootstrap/app.php                                      - Middleware registration
bootstrap/providers.php                                - Service provider registration
routes/api.php                                         - API routes
```

## 🔧 Konfigurasi

### Environment Variables

```env
# Enable/disable system monitoring
SYSTEM_MONITORING_ENABLED=true

# Interval dalam detik (default: 60 detik = 1 menit)
SYSTEM_MONITORING_INTERVAL=60

# API Configuration
SYSTEM_MONITORING_API_URL=http://100.99.20.71:3001/api/monitoring
SYSTEM_MONITORING_API_TOKEN=prod-token-123

# Optional settings
SYSTEM_MONITORING_DATA_RETENTION=5
SYSTEM_MONITORING_MAX_ENTRIES=100
SYSTEM_MONITORING_TIMEOUT=30
SYSTEM_MONITORING_RETRY_ATTEMPTS=3
SYSTEM_MONITORING_RETRY_DELAY=1000
```

## 🚀 Cara Kerja Auto-Start

### 1. **Middleware Monitoring** (Primary)

- Trigger setiap request ke aplikasi (web & API)
- Cek interval waktu (default: 60 detik)
- Jika sudah waktunya, dispatch job untuk mengirim data

### 2. **Service Provider Monitoring** (Secondary)

- Auto-start saat aplikasi boot
- Menggunakan `register_shutdown_function` untuk PHP-FPM
- Output buffering untuk SAPI lainnya

### 3. **Simple Service** (Centralized Logic)

- Centralized logic tanpa Closure
- Check interval dan dispatch job
- Background processing

## 📊 API Endpoints

| Method | Endpoint                                | Deskripsi             |
| ------ | --------------------------------------- | --------------------- |
| GET    | `/api/system-monitoring/auto-status`    | Status monitoring     |
| POST   | `/api/system-monitoring/start-auto`     | Start manual          |
| POST   | `/api/system-monitoring/force-execute`  | Force execute         |
| GET    | `/api/system-monitoring/health`         | Health check          |
| GET    | `/api/system-monitoring/test`           | Test API              |
| GET    | `/api/system-monitoring/telescope-data` | Sample data Telescope |
| GET    | `/api/system-monitoring/pulse-data`     | Sample data Pulse     |
| POST   | `/api/system-monitoring/send-data`      | Send manual           |

## 📝 Data yang Dikirim

Setiap 1 menit, sistem mengirim data dalam format JSON:

```json
{
  "timestamp": "2024-01-15T10:30:00.000000Z",
  "system": "laravel_app",
  "telescope": {
    "total_entries": 1500,
    "recent_entries": 25,
    "entry_types": {
      "request": 10,
      "query": 8,
      "exception": 2,
      "log": 5
    },
    "recent_entries_data": [...]
  },
  "pulse": {
    "total_entries": 800,
    "recent_entries": 15,
    "entry_types": {
      "request": 8,
      "query": 4,
      "exception": 1,
      "log": 2
    },
    "recent_entries_data": [...]
  },
  "server_info": {
    "php_version": "8.2.0",
    "laravel_version": "10.0.0",
    "memory_usage": 16777216,
    "peak_memory": 20971520
  }
}
```

## 🔒 Security & Authentication

- ✅ Token API disimpan di environment variables
- ✅ Header `X-API-Token` untuk autentikasi
- ✅ HTTPS recommended untuk production
- ✅ Timeout dan retry mechanism
- ✅ Comprehensive error logging

## 🧪 Test Results

### ✅ Status Check

```json
{
    "enabled": true,
    "interval_seconds": "60",
    "last_execution": "1757878204",
    "last_successful_send": null,
    "last_error": null,
    "methods_active": {
        "middleware_monitoring": true,
        "service_provider_monitoring": true,
        "simple_monitoring": true
    }
}
```

### ✅ Force Execute

```json
{
    "success": true,
    "message": "System monitoring job dispatched successfully",
    "timestamp": "2025-09-14T19:37:52.495465Z"
}
```

## 🚨 Troubleshooting

### 1. **Auto-Start Tidak Berjalan**

```bash
# Cek status
curl -X GET http://your-app.com/api/system-monitoring/auto-status

# Force start
curl -X POST http://your-app.com/api/system-monitoring/start-auto
```

### 2. **Queue Job Tidak Berjalan**

```bash
# Set sync queue untuk testing
QUEUE_CONNECTION=sync

# Atau jalankan worker
php artisan queue:work
```

### 3. **API Token Error**

```bash
# Cek konfigurasi
php artisan tinker
>>> config('system-monitoring.api_token')
>>> config('system-monitoring.api_url')
```

## 📈 Keunggulan

- ✅ **Tidak perlu akses server fisik**
- ✅ **Tidak perlu crontab**
- ✅ **Tidak perlu artisan command**
- ✅ **Multiple fallback methods**
- ✅ **Background processing**
- ✅ **Automatic retry**
- ✅ **Comprehensive logging**
- ✅ **Production ready**
- ✅ **Header X-API-Token untuk autentikasi**

## 📝 Log Files

- `storage/logs/system-monitoring.log` - Log khusus system monitoring
- `storage/logs/laravel.log` - Log umum Laravel
- Cache untuk tracking execution time

## ✅ Checklist Setup

- [x] Environment variables dikonfigurasi
- [x] Service Provider terdaftar
- [x] Middleware terdaftar
- [x] Routes tersedia
- [x] Queue job siap
- [x] Auto-start service berjalan
- [x] Multiple trigger methods aktif
- [x] Test endpoints berhasil
- [x] Header X-API-Token dikonfigurasi
- [x] Documentation lengkap

## 🎯 Quick Start

1. **Set Environment Variables**:

    ```env
    SYSTEM_MONITORING_ENABLED=true
    SYSTEM_MONITORING_INTERVAL=60
    SYSTEM_MONITORING_API_URL=http://100.99.20.71:3001/api/monitoring
    SYSTEM_MONITORING_API_TOKEN=prod-token-123
    ```

2. **Deploy Aplikasi**:
    - Sistem otomatis berjalan
    - Tidak perlu setup tambahan

3. **Verifikasi**:
    ```bash
    curl -X GET http://your-app.com/api/system-monitoring/auto-status
    curl -X POST http://your-app.com/api/system-monitoring/force-execute
    ```

---

## 🎉 **SISTEM SIAP DIGUNAKAN!**

**Data dari Telescope dan Pulse akan otomatis dikirim ke API eksternal setiap 1 menit sekali dengan header `X-API-Token` untuk autentikasi.**

**Tidak perlu akses server fisik!** 🚀
