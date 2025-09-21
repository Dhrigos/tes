# Environment Configuration Guide

## URL Scheme Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# Force HTTPS Configuration
FORCE_HTTPS=false
FORCE_HTTPS_IN_PRODUCTION=true

# Trusted Proxies (for load balancers/reverse proxies)
TRUSTED_PROXIES=*

# Vite Development Server Configuration
VITE_DEV_SERVER=false
VITE_HMR_HOST=localhost
VITE_HMR_PORT=5173
```

### Configuration Options

#### FORCE_HTTPS

- **Default**: `false`
- **Description**: Force HTTPS for all requests regardless of environment
- **Use case**: When you want to force HTTPS even in development

#### FORCE_HTTPS_IN_PRODUCTION

- **Default**: `true`
- **Description**: Force HTTPS only in production/staging environments
- **Use case**: Standard security practice for production

#### TRUSTED_PROXIES

- **Default**: `*`
- **Description**: Comma-separated list of trusted proxy IPs
- **Use case**: When behind load balancer or reverse proxy

### Environment-Specific Examples

#### Local Development

```env
APP_ENV=local
APP_URL=http://localhost:8000
FORCE_HTTPS=false
FORCE_HTTPS_IN_PRODUCTION=true
```

#### Staging

```env
APP_ENV=staging
APP_URL=https://staging.example.com
FORCE_HTTPS=false
FORCE_HTTPS_IN_PRODUCTION=true
```

#### Production

```env
APP_ENV=production
APP_URL=https://example.com
FORCE_HTTPS=false
FORCE_HTTPS_IN_PRODUCTION=true
```

### Proxy Configuration

When behind a reverse proxy (nginx, load balancer), ensure these headers are set:

```nginx
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Port $server_port;
```

### Vite Development Server

For Vite development server with HTTPS:

```env
VITE_DEV_SERVER=true
VITE_HMR_HOST=your-server-ip
VITE_HMR_PORT=5173
```

## How It Works

1. **Environment Detection**: Checks `APP_ENV` to determine environment
2. **Configuration Priority**:
    - `FORCE_HTTPS` (explicit override)
    - `FORCE_HTTPS_IN_PRODUCTION` (production only)
    - Proxy headers detection
    - `APP_URL` scheme detection
3. **Fallback**: HTTP for local development
