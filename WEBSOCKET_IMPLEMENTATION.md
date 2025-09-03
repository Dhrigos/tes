# Implementasi WebSocket untuk Sistem Permintaan Barang

## Overview

Sistem ini telah diubah dari penggunaan External Database manual menjadi WebSocket real-time menggunakan Laravel Broadcasting dengan Pusher/Reveb. Ini memberikan efisiensi yang lebih baik dalam sinkronisasi data antar klinik dan gudang utama.

## Fitur Utama

### 1. Real-time Communication

- **Permintaan Barang Baru**: Notifikasi real-time saat ada permintaan baru
- **Konfirmasi Permintaan**: Update status real-time saat permintaan dikonfirmasi
- **Pengiriman Barang**: Notifikasi saat barang dikirim
- **Penerimaan Barang**: Konfirmasi real-time saat barang diterima

### 2. Role-based Broadcasting

- **Gudang Utama** (`is_gudangutama_active = 1`): Dapat melihat semua permintaan dari klinik cabang
- **Klinik Cabang** (`is_gudangutama_active = 0`): Hanya dapat melihat permintaan sendiri

### 3. Channel Management

- Setiap grup klinik memiliki channel unik: `permintaan-barang.{kode_klinik}`
- Data terisolasi berdasarkan `kode_klinik` dari `Web_Setting`

## Arsitektur Sistem

### Backend (Laravel)

#### 1. Events

```php
app/Events/PermintaanBarangEvent.php
```

- Event untuk broadcast WebSocket
- Menggunakan channel berdasarkan `kode_klinik`
- Support untuk berbagai tipe event

#### 2. Service Layer

```php
app/Services/PermintaanBarangWebSocketService.php
```

- Service untuk mengelola broadcast events
- Methods untuk berbagai tipe broadcast
- Error handling dan logging

#### 3. Controllers

- **Permintaan_Barang_Controller**: Broadcast saat permintaan baru dan penerimaan
- **Daftar_Permintaan_Barang_Controller**: Broadcast saat konfirmasi dan pengiriman
- **WebSocketController**: API endpoints untuk real-time data

#### 4. API Endpoints

```
GET /api/websocket/permintaan-barang     # Real-time data
GET /api/websocket/notification-count    # Count notifications
GET /api/websocket/connection-status     # Connection info
```

### Frontend (React + TypeScript)

#### 1. WebSocket Service

```typescript
resources / js / services / WebSocketService.js;
```

- Service JavaScript untuk WebSocket
- Auto-reconnection dengan exponential backoff
- Event handling dan notification

#### 2. React Provider

```typescript
resources / js / components / WebSocketProvider.tsx;
```

- Context provider untuk WebSocket
- State management untuk connection status
- Real-time data synchronization

#### 3. Laravel Echo Integration

```typescript
resources / js / app.tsx;
```

- Konfigurasi Laravel Echo dan Pusher
- Global WebSocket setup

## Konfigurasi

### 1. Environment Variables

```bash
# Pusher Configuration
PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=ap1

# Frontend
VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"
```

### 2. Broadcasting Configuration

```php
// config/broadcasting.php
'pusher' => [
    'driver' => 'pusher',
    'key' => env('PUSHER_APP_KEY'),
    'secret' => env('PUSHER_APP_SECRET'),
    'app_id' => env('PUSHER_APP_ID'),
    'options' => [
        'cluster' => env('PUSHER_APP_CLUSTER'),
        'encrypted' => true,
    ],
],
```

## Cara Penggunaan

### 1. Setup WebSocket Provider

```tsx
import WebSocketProvider from './components/WebSocketProvider';

function App() {
    return <WebSocketProvider>{/* Your app components */}</WebSocketProvider>;
}
```

### 2. Menggunakan WebSocket Hook

```tsx
import { useWebSocket } from './components/WebSocketProvider';

function MyComponent() {
    const { isConnected, realtimeData, notificationCount } = useWebSocket();

    // Component logic
}
```

### 3. Listening to Events

```tsx
const { on, off } = useWebSocket();

useEffect(() => {
    const handlePermintaanUpdate = (data) => {
        console.log('Permintaan updated:', data);
    };

    on('permintaan_baru', handlePermintaanUpdate);

    return () => off('permintaan_baru', handlePermintaanUpdate);
}, []);
```

## Flow Sistem

### 1. Permintaan Barang Baru

```
Klinik Cabang → Create Permintaan → Broadcast Event → Gudang Utama (Real-time)
```

### 2. Konfirmasi Permintaan

```
Gudang Utama → Konfirmasi → Broadcast Event → Klinik Cabang (Real-time)
```

### 3. Pengiriman Barang

```
Gudang Utama → Proses Pengiriman → Broadcast Event → Klinik Cabang (Real-time)
```

### 4. Penerimaan Barang

```
Klinik Cabang → Terima Barang → Broadcast Event → Gudang Utama (Real-time)
```

## Keuntungan Implementasi WebSocket

### 1. Efisiensi

- **Real-time**: Tidak perlu refresh halaman atau polling
- **Reduced Database Load**: Tidak ada koneksi database eksternal berulang
- **Instant Updates**: Perubahan langsung terlihat di semua client

### 2. Scalability

- **Horizontal Scaling**: Support multiple server instances
- **Load Balancing**: Pusher/Reveb handle connection management
- **Auto-scaling**: Pusher automatically scales based on usage

### 3. User Experience

- **Live Notifications**: User mendapat notifikasi real-time
- **Status Updates**: Status permintaan update otomatis
- **Collaboration**: Multiple user dapat melihat update bersamaan

### 4. Maintenance

- **Centralized**: Semua event handling terpusat
- **Monitoring**: Pusher dashboard untuk monitoring
- **Debugging**: Log events untuk troubleshooting

## Troubleshooting

### 1. Connection Issues

- Check Pusher credentials
- Verify network connectivity
- Check browser console for errors

### 2. Event Not Received

- Verify channel subscription
- Check event naming convention
- Ensure proper authentication

### 3. Performance Issues

- Monitor Pusher dashboard
- Check event frequency
- Optimize payload size

## Monitoring dan Analytics

### 1. Pusher Dashboard

- Connection metrics
- Event delivery rates
- Error tracking

### 2. Application Logs

- WebSocket connection logs
- Event broadcast logs
- Error logs

### 3. Custom Metrics

- Event count by type
- User activity tracking
- Performance metrics

## Security Considerations

### 1. Channel Isolation

- Setiap klinik hanya dapat akses channel sendiri
- Data terisolasi berdasarkan `kode_klinik`

### 2. Authentication

- CSRF protection untuk API endpoints
- User authentication untuk WebSocket access

### 3. Data Validation

- Input validation di semua endpoints
- Sanitization data sebelum broadcast

## Future Enhancements

### 1. Advanced Features

- File upload via WebSocket
- Voice/video communication
- Screen sharing

### 2. Analytics

- User behavior tracking
- Performance metrics
- Business intelligence

### 3. Integration

- Third-party services
- Mobile app support
- API external access
