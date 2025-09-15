# Server Monitoring - Quick Start

## 🚀 Quick Setup

### 1. **Install Dependencies**

```bash
npm install
```

### 2. **Start Server**

```bash
# Development
npm run dev

# Production
npm start
```

### 3. **Test Server**

```bash
node test-server.js
```

## 📡 Endpoints

### **POST** `/api/monitoring`

- **URL**: `http://localhost:3001/api/monitoring`
- **Headers**: `X-API-Token: prod-token-123`
- **Body**: JSON payload dari Laravel app

### **GET** `/health`

- **URL**: `http://localhost:3001/health`
- **Response**: Server status

## 🔧 Configuration

### **API Token**

```javascript
// Di server-example.js, line 20
if (token !== 'prod-token-123') {
```

### **Port**

```javascript
// Di server-example.js, line 2
const port = 3001;
```

## 📦 Payload Example

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
        }
    },
    "pulse": {
        "total_entries": 800,
        "recent_entries": 15,
        "entry_types": {
            "request": 8,
            "query": 4,
            "exception": 1,
            "log": 2
        }
    },
    "server_info": {
        "php_version": "8.2.0",
        "laravel_version": "10.0.0",
        "memory_usage": 16777216,
        "peak_memory": 20971520
    }
}
```

## 🧪 Testing

### **Manual Test**

```bash
curl -X POST http://localhost:3001/api/monitoring \
  -H "Content-Type: application/json" \
  -H "X-API-Token: prod-token-123" \
  -d '{"timestamp":"2024-01-15T10:30:00.000000Z","system":"laravel_app","telescope":{"total_entries":100,"recent_entries":5,"entry_types":{"request":3}},"pulse":{"total_entries":50,"recent_entries":3,"entry_types":{"request":3}},"server_info":{"php_version":"8.2.0","laravel_version":"10.0.0","memory_usage":50000000}}'
```

### **Automated Test**

```bash
node test-server.js
```

## 🚨 Alerts

Server akan mengirim alert jika:

- Exception count > 5
- Memory usage > 100MB
- Request count > 100

## 📊 Logs

Server akan log:

- 📊 Data yang diterima
- 💾 Proses penyimpanan
- 🚨 Alert yang terdeteksi
- 📈 Update metrics

## 🔧 Customization

### **Database Integration**

```javascript
// Di function storeToDatabase()
// Implementasi database storage sesuai kebutuhan
```

### **Notification System**

```javascript
// Di function sendNotifications()
// Implementasi notifikasi (Slack, email, SMS)
```

### **Metrics System**

```javascript
// Di function updateMetrics()
// Integrasi dengan Prometheus, Grafana, dll
```

## 🚀 Production Deployment

### **Docker**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### **PM2**

```bash
npm install -g pm2
pm2 start server-example.js --name "monitoring-server"
pm2 startup
pm2 save
```

### **Nginx**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/monitoring {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

**Server siap menerima data monitoring!** 🎉
