# Payload Example - System Monitoring

## 📦 Payload yang Dikirim ke Server

### **URL**: `http://100.99.20.71:3001/api/monitoring`

### **Method**: `POST`

### **Headers**: `X-API-Token: prod-token-123`

## 🔍 Contoh Payload Lengkap

```json
{
    "timestamp": "2025-09-14T19:51:20.040493Z",
    "system": "laravel_app",
    "telescope": {
        "total_entries": 594462,
        "recent_entries": 39,
        "entry_types": {
            "cache": 9,
            "client_request": 3,
            "command": 11,
            "log": 1,
            "redis": 9,
            "request": 4,
            "view": 2
        },
        "recent_entries_data": [
            {
                "type": "command",
                "content": "{\"command\":\"list\",\"exit_code\":0,\"arguments\":{\"command\":\"list\",\"namespace\":null},\"options\":{\"raw\":false,\"format\":\"txt\",\"short\":false,\"help\":false,\"silent\":false,\"quiet\":false,\"verbose\":false,\"version\":false,\"ansi\":null,\"no-interaction\":false,\"env\":null},\"hostname\":\"ubuntu\"}",
                "created_at": "2025-09-14 19:48:49",
                "batch_id": "9fe0d14c-d6ab-4d5e-a4ff-f8e86695857b"
            },
            {
                "type": "request",
                "content": "{\"ip_address\":\"100.99.20.71\",\"uri\":\"\\\/api\\\/system-monitoring\\\/test\",\"method\":\"GET\",\"controller_action\":\"App\\\\Http\\\\Controllers\\\\SystemMonitoringController@test\",\"middleware\":[\"api\",\"Laravel\\\\Nightwatch\\\\Hooks\\\\RouteMiddleware\"],\"headers\":{...},\"payload\":[],\"session\":[],\"response_headers\":{\"cache-control\":\"no-cache, private\",\"date\":\"Sun, 14 Sep 2025 19:46:58 GMT\",\"content-type\":\"application\\\/json\",\"access-control-allow-origin\":\"*\"},\"response_status\":400,\"response\":{...},\"duration\":2078,\"memory\":4,\"hostname\":\"ubuntu\"}",
                "created_at": "2025-09-14 19:46:58",
                "batch_id": "9fe0d0a2-9aee-4211-99e6-3de1aeab0fbc"
            }
        ]
    },
    "pulse": {
        "total_entries": 2841,
        "recent_entries": 44,
        "entry_types": {
            "cache_hit": 39,
            "cache_miss": 4,
            "slow_request": 1
        },
        "recent_entries_data": [
            {
                "id": 2909,
                "timestamp": 1757879372,
                "type": "cache_hit",
                "key": "simple_system_monitoring_last_execution",
                "value": null
            },
            {
                "id": 2899,
                "timestamp": 1757879216,
                "type": "slow_request",
                "key": "[\"GET\",\"\\\/api\\\/system-monitoring\\\/test\",\"App\\\\Http\\\\Controllers\\\\SystemMonitoringController@test\"]",
                "value": 2118
            }
        ]
    },
    "server_info": {
        "php_version": "8.2.0",
        "laravel_version": "10.0.0",
        "memory_usage": 16777216,
        "peak_memory": 20971520
    }
}
```

## 📊 Penjelasan Field

### **Root Level**

- `timestamp`: ISO 8601 timestamp kapan data dikirim
- `system`: Identifier sistem (selalu "laravel_app")

### **Telescope Data**

- `total_entries`: Total semua entries di database Telescope (594,462)
- `recent_entries`: Jumlah entries dalam 5 menit terakhir (39)
- `entry_types`: Breakdown berdasarkan tipe entry
    - `cache`: Cache operations (9)
    - `client_request`: HTTP requests ke external API (3)
    - `command`: Artisan commands (11)
    - `log`: Log entries (1)
    - `redis`: Redis operations (9)
    - `request`: Web requests (4)
    - `view`: View rendering (2)
- `recent_entries_data`: Array data entries terbaru (max 100)

### **Pulse Data**

- `total_entries`: Total semua entries di database Pulse (2,841)
- `recent_entries`: Jumlah entries dalam 5 menit terakhir (44)
- `entry_types`: Breakdown berdasarkan tipe entry
    - `cache_hit`: Cache hits (39)
    - `cache_miss`: Cache misses (4)
    - `slow_request`: Slow requests > 1000ms (1)
- `recent_entries_data`: Array data entries terbaru (max 100)

### **Server Info**

- `php_version`: Versi PHP yang digunakan (8.2.0)
- `laravel_version`: Versi Laravel yang digunakan (10.0.0)
- `memory_usage`: Penggunaan memory saat ini (16MB)
- `peak_memory`: Peak memory usage (20MB)

## 🚨 Alert Thresholds

Server monitoring bisa mengirim alert jika:

### **Exception Alert**

```json
{
    "condition": "telescope.entry_types.exception > 5",
    "message": "High exception count detected",
    "severity": "WARNING"
}
```

### **Memory Alert**

```json
{
    "condition": "server_info.memory_usage > 100000000",
    "message": "High memory usage detected (>100MB)",
    "severity": "WARNING"
}
```

### **Slow Request Alert**

```json
{
    "condition": "pulse.entry_types.slow_request > 0",
    "message": "Slow requests detected",
    "severity": "INFO"
}
```

### **Cache Miss Alert**

```json
{
    "condition": "pulse.entry_types.cache_miss > 10",
    "message": "High cache miss rate",
    "severity": "INFO"
}
```

## 🔧 Server Response

### **Success Response**

```json
{
    "success": true,
    "message": "Data received successfully",
    "timestamp": "2025-09-14T19:51:20.040493Z",
    "received_at": "2025-09-14T19:51:20.040493Z",
    "processed": {
        "telescope_entries": 39,
        "pulse_entries": 44,
        "memory_usage": 16777216
    }
}
```

### **Error Response**

```json
{
    "success": false,
    "message": "Missing required fields: timestamp, system, telescope, pulse",
    "error_code": "MISSING_FIELDS",
    "timestamp": "2025-09-14T19:51:20.040493Z"
}
```

## 📈 Metrics yang Bisa Dimonitor

### **Performance Metrics**

- Request count per minute
- Response time distribution
- Memory usage trends
- Cache hit/miss ratio

### **Error Metrics**

- Exception count per minute
- Error rate percentage
- Failed request count

### **System Metrics**

- PHP version
- Laravel version
- Memory usage
- Peak memory usage

## 🧪 Test Payload

### **Minimal Test**

```bash
curl -X POST http://100.99.20.71:3001/api/monitoring \
  -H "Content-Type: application/json" \
  -H "X-API-Token: prod-token-123" \
  -d '{
    "timestamp": "2025-09-14T19:51:20.040493Z",
    "system": "laravel_app",
    "telescope": {
      "total_entries": 100,
      "recent_entries": 5,
      "entry_types": {
        "request": 3,
        "query": 2
      },
      "recent_entries_data": []
    },
    "pulse": {
      "total_entries": 50,
      "recent_entries": 3,
      "entry_types": {
        "cache_hit": 3
      },
      "recent_entries_data": []
    },
    "server_info": {
      "php_version": "8.2.0",
      "laravel_version": "10.0.0",
      "memory_usage": 50000000,
      "peak_memory": 60000000
    }
  }'
```

## ✅ Checklist Server Implementation

- [ ] Endpoint `/api/monitoring` dengan method POST
- [ ] Validasi header `X-API-Token: prod-token-123`
- [ ] Validasi required fields: `timestamp`, `system`, `telescope`, `pulse`
- [ ] Process data dan store ke database
- [ ] Implementasi alerting untuk threshold
- [ ] Response dengan format yang benar
- [ ] Error handling yang comprehensive
- [ ] Logging untuk audit trail

---

**Payload siap untuk implementasi server monitoring!** 🚀
