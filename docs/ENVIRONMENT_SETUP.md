# Environment Setup Guide

## Quick Start

### 1. Copy Environment Template

```bash
# Copy the template to .env
cp env.template .env

# Or use the setup script
./setup-env.sh
```

### 2. Generate Application Key

```bash
php artisan key:generate
```

### 3. Configure Database

Update the database settings in your `.env` file:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### 4. Run Migrations

```bash
php artisan migrate
```

### 5. Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install

# Build assets for production
npm run build

# Or start development server
npm run dev
```

### 6. Vite Development Commands

```bash
# Start Vite dev server (HTTP)
npm run dev

# Start Vite dev server with HTTPS
npm run dev:https

# Start Vite dev server accessible from network
npm run dev:host

# Use the custom development script
./scripts/vite-dev.sh

# Use the management script (recommended for HTTPS)
./scripts/manage-vite.sh start
./scripts/manage-vite.sh stop
./scripts/manage-vite.sh restart
./scripts/manage-vite.sh status
./scripts/manage-vite.sh test

# Build for production
npm run build

# Preview production build
npm run preview
```

### 7. HTTPS Configuration for Mixed Content Issues

If you're getting mixed content errors (HTTPS page trying to load HTTP resources), follow these steps:

#### Step 1: Update APP_URL to HTTPS

```bash
# Update .env file
sed -i 's|APP_URL=http://|APP_URL=https://|g' .env

# Or manually edit .env
APP_URL=https://100.106.3.92
```

#### Step 2: Start Vite with HTTPS

```bash
# Start Vite with HTTPS (fixes mixed content)
./scripts/manage-vite.sh start

# Test the connection
./scripts/manage-vite.sh test

# Check status
./scripts/manage-vite.sh status
```

#### Step 3: Clear Laravel Cache

```bash
php artisan config:clear
php artisan cache:clear
```

This will ensure both Vite dev server and Laravel asset URLs use HTTPS, preventing mixed content errors when your main application is served over HTTPS.

### 8. SigNoz OpenTelemetry Testing

To test the OpenTelemetry connection to SigNoz:

```bash
# Test middleware instantiation and configuration
php scripts/test-middleware.php

# Check if SigNoz is running
curl -f http://100.99.20.71:3301/health || echo "SigNoz not running"

# View traces in SigNoz UI
echo "Open SigNoz UI at: http://100.99.20.71:3301"
```

The test script will verify that the OpenTelemetry middleware can be instantiated and configured properly. Make sure SigNoz is running and accessible at the configured endpoint.

## Environment Variables

### Required Variables

- `APP_NAME` - Application name
- `APP_ENV` - Environment (local, staging, production)
- `APP_KEY` - Application encryption key
- `APP_URL` - Application URL
- `DB_*` - Database configuration

### Optional Variables

#### URL Configuration

- `FORCE_HTTPS` - Force HTTPS for all requests (default: false)
- `FORCE_HTTPS_IN_PRODUCTION` - Force HTTPS in production (default: true)
- `TRUSTED_PROXIES` - Trusted proxy IPs (default: \*)

#### Vite Development Server

- `VITE_DEV_SERVER` - Enable Vite dev server (default: false)
- `VITE_HMR_HOST` - HMR host for development (default: localhost)
- `VITE_HMR_PORT` - HMR port for development (default: 5173)
- `VITE_HTTPS` - Enable HTTPS for Vite dev server (default: false)
- `VITE_SSL_KEY` - Path to SSL private key (default: /etc/nginx/ssl/selfsigned.key)
- `VITE_SSL_CERT` - Path to SSL certificate (default: /etc/nginx/ssl/selfsigned.crt)

#### BPJS Integration

- `BPJS_BaseUrl` - BPJS API base URL
- `BPJS_WS_Service` - BPJS web service name
- `BPJS_App_code` - BPJS application code

#### Monitoring

- `TELESCOPE_ENABLED` - Enable Laravel Telescope (default: true)
- `PULSE_ENABLED` - Enable Laravel Pulse (default: true)

#### SigNoz OpenTelemetry

- `OTEL_ENABLED` - Enable OpenTelemetry tracing (default: true)
- `OTEL_EXPORTER_OTLP_ENDPOINT` - SigNoz OTLP endpoint (default: http://localhost:4318/v1/traces)
- `OTEL_SERVICE_NAME` - Service name for traces (default: laravel-app)
- `OTEL_SERVICE_VERSION` - Service version (default: 1.0.0)
- `OTEL_EXPORTER_OTLP_PROTOCOL` - OTLP protocol (default: http/protobuf)
- `OTEL_EXPORTER_OTLP_HEADERS` - Authentication headers (default: empty)
- `OTEL_TRACES_SAMPLER` - Sampling type (default: traceidratio)
- `OTEL_TRACES_SAMPLER_ARG` - Sampling ratio (default: 1.0)

## Environment-Specific Configurations

### Local Development

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
FORCE_HTTPS=false
VITE_DEV_SERVER=true
```

### Staging

```env
APP_ENV=staging
APP_DEBUG=false
APP_URL=https://staging.example.com
FORCE_HTTPS_IN_PRODUCTION=true
```

### Production

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://example.com
FORCE_HTTPS_IN_PRODUCTION=true
```

## Troubleshooting

### Common Issues

1. **APP_KEY not set**

    ```bash
    php artisan key:generate
    ```

2. **Database connection failed**
    - Check database credentials in `.env`
    - Ensure database server is running
    - Verify database exists

3. **HTTPS issues**
    - Check `FORCE_HTTPS` and `FORCE_HTTPS_IN_PRODUCTION` settings
    - Verify proxy headers if behind load balancer
    - Check `APP_URL` scheme

4. **Vite dev server issues**
    - Set `VITE_DEV_SERVER=true` for development
    - Check `VITE_HMR_HOST` and `VITE_HMR_PORT`
    - Ensure SSL certificates exist if using HTTPS

### File Permissions

```bash
# Set proper permissions
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

## Security Notes

- Never commit `.env` file to version control
- Use strong passwords for database
- Enable HTTPS in production
- Set proper file permissions
- Use environment-specific configurations

## Support

For more detailed configuration options, see:

- `ENV_CONFIGURATION.md` - Detailed environment variable documentation
- `config/url.php` - URL configuration file
- Laravel documentation: https://laravel.com/docs
