# Apps Dev (Laravel 12 + Inertia React) – README

## Overview
A modern full‑stack application built with:
- Laravel 12 (PHP 8.2+)
- Inertia.js + React 19 + TypeScript
- Vite 7 + Tailwind CSS 4
- SSR support for Inertia

Key business modules live under `resources/js/pages/module/`:
- antrian, apotek, gudang, kasir, laporan, master, monitor, pasien, pelayanan, pembelian, pendaftaran, pendaftaran-online, sdm
Related docs:
 - QUEUE MANAGEMENT: `QUEUE_MANAGEMENT_README.md`
 - Security guidance: `SECURITY.md`
 - License: `LICENSE-PROPRIETARY.md`

  ## Requirements
  - PHP 8.2+
  - Composer 2
  - Node.js 18+ (recommended 20 LTS)
  - MariaDB/MySQL
  - Redis

Optional (for Docker/Sail):
- Docker + Docker Compose

## Quick Start (Local)
{{ ... }}
## Security
- Keep `.env` secrets out of version control
- Use HTTPS in production
- Rotate keys and tokens periodically
- Review `SECURITY.md` for more details
 
 ## Useful Links
 
 - Inertia.js: https://inertiajs.com/
  - Laravel: https://laravel.com/docs
  - Vite: https://vitejs.dev/guide/
  - Tailwind CSS: https://tailwindcss.com/

 ## License
 See `LICENSE-PROPRIETARY.md` for the applicable terms.
 A superseding notice is also placed at the top of `LICENSE` for repository history context.
