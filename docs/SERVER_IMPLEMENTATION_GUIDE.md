# Server Implementation Guide - System Monitoring

## 📋 Alur Sistem Monitoring

### 1. **Trigger Otomatis**

```
Request ke Laravel App → Middleware → Check Interval → Dispatch Job → Send Data
```

### 2. **Detail Alur**

```
1. User/System → Request ke Laravel App
2. SimpleSystemMonitoringService → Cek interval (60 detik)
3. Jika sudah waktunya → Dispatch SendSystemDataJob
4. Background processing → SystemDataService
5. Collect data dari Telescope & Pulse
6. HTTP POST → Server Monitoring dengan header X-API-Token
7. Server → Process data dan response
```

## 🔄 Flow Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Laravel App   │    │  Simple Service  │    │  Background Job │
│                 │───▶│  Monitoring      │───▶│  Processing     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Server         │◀───│  HTTP POST       │◀───│  Queue Job      │
│  Monitoring     │    │  with X-API-Token│    │  Background     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📡 API Endpoint yang Perlu Dibuat di Server

### **POST** `/api/monitoring`

**URL**: `http://100.99.20.71:3001/api/monitoring`

**Headers**:

```
Content-Type: application/json
Accept: application/json
X-API-Token: prod-token-123
User-Agent: Laravel-System-Monitor/1.0
```

## 📦 Payload yang Dikirim

### **Struktur Payload Lengkap**

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
      "log": 5,
      "cache": 3,
      "job": 1,
      "mail": 2
    },
    "recent_entries_data": [
      {
        "type": "request",
        "content": {
          "uri": "/api/users",
          "method": "GET",
          "headers": {...},
          "payload": {...}
        },
        "created_at": "2024-01-15T10:29:45.000000Z",
        "batch_id": "batch-123"
      }
    ]
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
    "recent_entries_data": [
      {
        "type": "request",
        "content": {
          "uri": "/api/dashboard",
          "method": "POST",
          "duration": 150,
          "memory": 2048
        },
        "created_at": "2024-01-15T10:29:50.000000Z",
        "batch_id": "batch-124"
      }
    ]
  },
  "server_info": {
    "php_version": "8.2.0",
    "laravel_version": "10.0.0",
    "memory_usage": 16777216,
    "peak_memory": 20971520,
    "server_time": "2024-01-15T10:30:00.000000Z"
  }
}
```

### **Penjelasan Field**

#### **Root Level**

- `timestamp`: ISO 8601 timestamp kapan data dikirim
- `system`: Identifier sistem (selalu "laravel_app")

#### **Telescope Data**

- `total_entries`: Total semua entries di database Telescope
- `recent_entries`: Jumlah entries dalam 5 menit terakhir
- `entry_types`: Breakdown berdasarkan tipe entry
- `recent_entries_data`: Array data entries terbaru (max 100)

#### **Pulse Data**

- `total_entries`: Total semua entries di database Pulse
- `recent_entries`: Jumlah entries dalam 5 menit terakhir
- `entry_types`: Breakdown berdasarkan tipe entry
- `recent_entries_data`: Array data entries terbaru (max 100)

#### **Server Info**

- `php_version`: Versi PHP yang digunakan
- `laravel_version`: Versi Laravel yang digunakan
- `memory_usage`: Penggunaan memory saat ini (bytes)
- `peak_memory`: Peak memory usage (bytes)

## 🔧 Implementasi Server (Node.js/Express)

### **1. Setup Basic Server**

```javascript
const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// API Token validation
const validateApiToken = (req, res, next) => {
    const token = req.headers['x-api-token'];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'X-API-Token header required',
        });
    }

    if (token !== 'prod-token-123') {
        return res.status(401).json({
            success: false,
            message: 'Invalid API token',
        });
    }

    next();
};
```

### **2. Endpoint Handler**

```javascript
// POST /api/monitoring
app.post('/api/monitoring', validateApiToken, (req, res) => {
    try {
        const data = req.body;

        // Validate required fields
        if (!data.timestamp || !data.system || !data.telescope || !data.pulse) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
            });
        }

        // Process the data
        processMonitoringData(data);

        // Response
        res.status(200).json({
            success: true,
            message: 'Data received successfully',
            timestamp: new Date().toISOString(),
            received_at: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error processing monitoring data:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
});
```

### **3. Data Processing Function**

```javascript
function processMonitoringData(data) {
    console.log('Processing monitoring data:', {
        timestamp: data.timestamp,
        system: data.system,
        telescope_entries: data.telescope.recent_entries,
        pulse_entries: data.pulse.recent_entries,
        server_info: data.server_info,
    });

    // Store to database
    storeToDatabase(data);

    // Check for alerts
    checkAlerts(data);

    // Update metrics
    updateMetrics(data);
}

function storeToDatabase(data) {
    // Store to your database
    // Example: MongoDB, PostgreSQL, etc.
    console.log('Storing to database...');
}

function checkAlerts(data) {
    // Check for critical issues
    if (data.telescope.entry_types.exception > 5) {
        console.log('ALERT: High exception count detected!');
        // Send notification
    }

    if (data.server_info.memory_usage > 100000000) {
        // 100MB
        console.log('ALERT: High memory usage detected!');
        // Send notification
    }
}

function updateMetrics(data) {
    // Update real-time metrics
    console.log('Updating metrics...');
}
```

## 🔧 Implementasi Server (Python/Flask)

### **1. Setup Basic Server**

```python
from flask import Flask, request, jsonify
from datetime import datetime
import logging

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def validate_api_token(func):
    def wrapper(*args, **kwargs):
        token = request.headers.get('X-API-Token')

        if not token:
            return jsonify({
                'success': False,
                'message': 'X-API-Token header required'
            }), 401

        if token != 'prod-token-123':
            return jsonify({
                'success': False,
                'message': 'Invalid API token'
            }), 401

        return func(*args, **kwargs)

    wrapper.__name__ = func.__name__
    return wrapper
```

### **2. Endpoint Handler**

```python
@app.route('/api/monitoring', methods=['POST'])
@validate_api_token
def receive_monitoring_data():
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['timestamp', 'system', 'telescope', 'pulse']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400

        # Process the data
        process_monitoring_data(data)

        # Response
        return jsonify({
            'success': True,
            'message': 'Data received successfully',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'received_at': datetime.utcnow().isoformat() + 'Z'
        }), 200

    except Exception as error:
        logger.error(f'Error processing monitoring data: {error}')
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'error': str(error)
        }), 500

def process_monitoring_data(data):
    logger.info(f'Processing monitoring data: {data["timestamp"]}')

    # Store to database
    store_to_database(data)

    # Check for alerts
    check_alerts(data)

    # Update metrics
    update_metrics(data)

def store_to_database(data):
    # Store to your database
    logger.info('Storing to database...')

def check_alerts(data):
    # Check for critical issues
    if data['telescope']['entry_types'].get('exception', 0) > 5:
        logger.warning('ALERT: High exception count detected!')

    if data['server_info']['memory_usage'] > 100000000:  # 100MB
        logger.warning('ALERT: High memory usage detected!')

def update_metrics(data):
    # Update real-time metrics
    logger.info('Updating metrics...')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001, debug=True)
```

## 📊 Database Schema (Contoh)

### **Monitoring Data Table**

```sql
CREATE TABLE monitoring_data (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    system VARCHAR(50) NOT NULL,
    telescope_total_entries INTEGER,
    telescope_recent_entries INTEGER,
    pulse_total_entries INTEGER,
    pulse_recent_entries INTEGER,
    php_version VARCHAR(20),
    laravel_version VARCHAR(20),
    memory_usage BIGINT,
    peak_memory BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE monitoring_entries (
    id SERIAL PRIMARY KEY,
    monitoring_data_id INTEGER REFERENCES monitoring_data(id),
    entry_type VARCHAR(50),
    entry_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚨 Error Handling

### **Response Format untuk Error**

```json
{
    "success": false,
    "message": "Error description",
    "error_code": "ERROR_CODE",
    "timestamp": "2024-01-15T10:30:00.000000Z"
}
```

### **Common Error Codes**

- `MISSING_TOKEN`: X-API-Token header tidak ada
- `INVALID_TOKEN`: Token tidak valid
- `MISSING_FIELDS`: Field required tidak ada
- `INVALID_DATA`: Format data tidak valid
- `SERVER_ERROR`: Internal server error

## 📈 Monitoring & Alerting

### **Metrics yang Bisa Dimonitor**

1. **Request Count**: Jumlah request per menit
2. **Exception Rate**: Rate exception per menit
3. **Memory Usage**: Penggunaan memory
4. **Response Time**: Waktu response
5. **Database Queries**: Jumlah query per menit

### **Alert Thresholds**

```javascript
const ALERT_THRESHOLDS = {
    EXCEPTION_COUNT: 5, // > 5 exceptions per minute
    MEMORY_USAGE: 100000000, // > 100MB
    RESPONSE_TIME: 5000, // > 5 seconds
    QUERY_COUNT: 100, // > 100 queries per minute
};
```

## 🔄 Testing

### **Test Payload**

```bash
curl -X POST http://100.99.20.71:3001/api/monitoring \
  -H "Content-Type: application/json" \
  -H "X-API-Token: prod-token-123" \
  -d '{
    "timestamp": "2024-01-15T10:30:00.000000Z",
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
        "request": 3
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

## ✅ Checklist Implementasi Server

- [ ] Setup server dengan endpoint `/api/monitoring`
- [ ] Implementasi validasi `X-API-Token` header
- [ ] Handle POST request dengan JSON payload
- [ ] Validasi required fields
- [ ] Process dan store data
- [ ] Implementasi error handling
- [ ] Setup logging
- [ ] Implementasi alerting
- [ ] Test dengan curl
- [ ] Setup database schema
- [ ] Implementasi monitoring dashboard

---

**Server siap menerima data monitoring dari Laravel app!** 🚀
