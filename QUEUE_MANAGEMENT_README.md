# Hospital/Clinic Queue Management System

## 📋 Overview

This comprehensive queue management system provides a complete solution for managing patient queues in hospitals and clinics. The system supports multi-stage queue processing, real-time monitoring, and automated queue management.

## 🏗️ System Architecture

### Three-Stage Queue Process
1. **Stage 1 (Loket A)**: Initial registration/check-in
2. **Stage 2 (Loket B)**: Nurse preliminary examination  
3. **Stage 3 (Loket C)**: Doctor consultation

### Database Schema

#### Existing Tables (Enhanced)
- `lokets` - Service counters/lokets
- `pendaftarans` - Patient registrations (contains `antrian` field)
- `pendaftaran_statuses` - Registration status tracking
- `pelayanan_statuses` - Service status tracking
- `antrian_pasiens` - Patient queue records

#### Queue Number Format
- Format: `{LOKET_NAME}-{DAILY_SEQUENCE}`
- Examples: "A-001", "POLI-015", "UMUM-008"
- Daily reset at midnight
- Auto-increment per loket

## 🖥️ User Interfaces

### 1. Patient Registration Kiosk (`/pendaftaran-online`)
- ✅ **Already implemented and enhanced**
- Large touch-friendly buttons for BPJS/Non-BPJS
- Patient search by NIK/BPJS number/Name
- Multi-step registration form with photo capture
- Real-time patient data validation
- Queue number printing functionality
- **Enhanced**: Loket-based queue generation

### 2. Queue Display Monitor (`/loket-antrian`)
- ✅ **Newly implemented**
- Large, readable queue numbers display
- Real-time auto-refresh (10-second intervals)
- Current serving status per loket
- Voice announcement toggle
- Continuous queue rotation display
- Responsive design for different screen sizes

### 3. Admin Interface (`/admin-antrian`)
- ✅ **Newly implemented**
- Queue statistics dashboard
- Loket performance monitoring
- Manual queue calling
- Daily queue reset functionality
- Real-time monitoring controls

### 4. Loket Management (`/datamaster/umum/loket`)
- ✅ **Already exists**
- Create/edit service counters
- Assign counters to medical departments
- Queue status management

## ⚙️ Technical Implementation

### Backend Controllers

#### MonitorController
```php
// Main queue management controller
- index()                 // Display monitor interface
- admin()                 // Display admin interface  
- getDataAntrian()        // Real-time queue data API
- panggilAntrian()        // Queue calling/status update
- getQueueStats()         // Queue statistics
- resetDailyQueues()      // Daily reset functionality
```

#### Enhanced Pendaftaran_online_Controller
```php
// Enhanced registration with queue integration
- generateNomorAntrian()         // Enhanced with loket-based prefixes
- determineLoketForRegistration() // Route patients to appropriate lokets
- ambilAntrian()                 // Enhanced queue generation
```

### Frontend Components

#### Monitor Interface (`monitor.tsx`)
- Real-time queue display
- Auto-refresh functionality
- Voice announcements using Web Speech API
- Manual queue calling
- Responsive design with dark/light theme support

#### Admin Interface (`admin.tsx`)
- Comprehensive dashboard
- Statistics overview
- Loket performance monitoring
- Quick actions panel
- Settings management

### API Endpoints

```php
// Queue Management APIs
GET  /api/antrian/data          // Get real-time queue data
POST /api/antrian/panggil       // Call next queue
GET  /api/antrian/stats         // Get queue statistics  
POST /api/antrian/reset-daily   // Reset daily queues

// Public Routes
GET  /loket-antrian            // Queue monitor display
GET  /pendaftaran-online       // Patient registration

// Authenticated Routes  
GET  /admin-antrian           // Admin interface
```

## 🔧 Features Implemented

### ✅ Core Features
- [x] Multi-stage queue processing (Registration → Nurse → Doctor)
- [x] Real-time queue monitoring with 10-second auto-refresh
- [x] Voice announcements using Web Speech API
- [x] Loket-based queue number generation
- [x] Daily queue reset at midnight (scheduled)
- [x] Comprehensive admin dashboard
- [x] Queue statistics and analytics
- [x] Manual queue calling functionality
- [x] Integration with existing patient registration system

### ✅ UI/UX Features
- [x] Responsive design compatible with light & dark themes
- [x] Large touch-friendly interface for kiosks
- [x] Real-time status indicators
- [x] Auto-rotating queue announcements
- [x] High contrast colors for accessibility
- [x] Voice announcement toggle

### ✅ Technical Features
- [x] Laravel backend with Eloquent ORM
- [x] React TypeScript frontend with Inertia.js
- [x] Real-time updates via AJAX polling
- [x] Queue number generation with daily reset
- [x] Integration with existing database schema
- [x] Scheduled jobs for maintenance tasks
- [x] Comprehensive error handling and logging

## 🚀 Installation & Setup

### 1. Files Created/Modified

#### New Files
```
app/Http/Controllers/Module/Antrian/MonitorController.php
app/Console/Commands/ResetDailyQueues.php
resources/js/Pages/module/antrian/monitor.tsx
resources/js/Pages/module/antrian/admin.tsx
```

#### Modified Files
```
routes/web.php                                          // Added queue routes
routes/console.php                                      // Added scheduled tasks
app/Http/Controllers/Module/Pendaftaran/Pendaftaran_online_Controller.php  // Enhanced
```

### 2. Routes Added
```php
// Public routes
GET  /loket-antrian                    // Queue monitor
GET  /pendaftaran-online              // Patient registration (enhanced)

// Authenticated routes  
GET  /admin-antrian                   // Admin interface

// API routes
GET  /api/antrian/data               // Queue data
POST /api/antrian/panggil            // Call queue
GET  /api/antrian/stats              // Statistics
POST /api/antrian/reset-daily        // Reset queues
```

### 3. Scheduled Tasks
```php
// Daily queue reset at 00:01
Schedule::command('queue:reset-daily')->daily()->at('00:01');
```

## 📊 Queue Management Logic

### Queue Number Generation
```php
// Enhanced generation with loket-based prefixes
private function generateNomorAntrian($prefix = 'A', $loketId = null)
{
    // Uses loket name as prefix if loketId provided
    // Daily sequence reset at midnight
    // Format: PREFIX-001, PREFIX-002, etc.
}
```

### Stage Management
```php
// Three-stage process
1. Registration (status_panggil = 0 → 1)
2. Nurse (pelayanan_statuses.status_perawat = 1)  
3. Doctor (pelayanan_statuses.status_dokter = 1)
```

### Real-time Updates
- 10-second polling for queue monitor
- 30-second polling for admin dashboard
- Immediate updates on manual actions
- Voice announcements for new calls

## 🎯 Usage Instructions

### For Patients
1. Visit `/pendaftaran-online`
2. Select BPJS/Non-BPJS
3. Search by NIK/BPJS/Name or register new
4. Select poli and doctor
5. Receive queue number
6. Monitor progress on `/loket-antrian`

### For Staff
1. Access admin panel at `/admin-antrian`
2. Monitor real-time statistics
3. Manually call queues if needed
4. Reset daily queues when required
5. View loket performance metrics

### For Display Monitors
1. Open `/loket-antrian` on display screens
2. Enable voice announcements
3. System auto-refreshes every 10 seconds
4. Shows current serving and waiting queues

## 🔧 Configuration

### Voice Announcements
- Uses Web Speech API (browser-based)
- Language: Indonesian (id-ID)
- Configurable rate and volume
- Toggle on/off functionality

### Auto-refresh Intervals
- Queue monitor: 10 seconds
- Admin dashboard: 30 seconds
- Configurable in component state

### Queue Reset
- Scheduled daily at 00:01
- Manual reset available in admin panel
- Maintains historical data for reporting

## 📈 Monitoring & Analytics

### Available Metrics
- Total registered patients
- Waiting at each stage
- Completed consultations
- Average waiting time
- Loket performance statistics
- Daily queue volumes

### Reporting Integration
- Integrates with existing `/laporan/antrian`
- Real-time statistics API
- Historical data preservation
- Export capabilities

## 🛠️ Maintenance

### Daily Tasks
- Automatic queue reset at midnight
- Log review for any issues
- Monitor system performance

### Weekly Tasks  
- Review queue statistics
- Optimize loket assignments
- Update voice announcement settings

### Monthly Tasks
- Analyze queue flow patterns
- Adjust system parameters
- Review and archive old data

## 🚨 Troubleshooting

### Common Issues
1. **Voice not working**: Check browser permissions for speech synthesis
2. **Auto-refresh stopped**: Check network connectivity and API endpoints
3. **Queue numbers not resetting**: Verify scheduled task is running
4. **Display not updating**: Clear browser cache and reload

### Logs Location
- Application logs: `storage/logs/laravel.log`
- Queue reset logs: Search for "Daily queue reset"
- Error tracking: Monitor API response codes

## 🔮 Future Enhancements

### Potential Improvements
- [ ] WebSocket integration for real-time updates
- [ ] Mobile app for patients
- [ ] SMS notifications for queue status
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Thermal printer integration
- [ ] Appointment scheduling integration
- [ ] Queue prediction algorithms

### Scalability Considerations
- Database indexing optimization
- Caching layer implementation
- Load balancing for high traffic
- Microservices architecture migration

---

## 📞 Support

For technical support or feature requests, please refer to the system administrator or development team.

**System Status**: ✅ Fully Operational
**Last Updated**: September 2025
**Version**: 1.0.0
