<?php

namespace App\Services;

use App\Models\Module\Pelayanan\Pelayanan_status;

class PelayananStatusService
{
    /**
     * Get status row for nomor_register. Returns array with defaults when missing.
     */
    public function ambilStatus(string $nomorRegister): array
    {
        $ps = Pelayanan_status::where('nomor_register', $nomorRegister)->first();
        return [
            'status_daftar'  => (int)($ps->status_daftar ?? 0),
            'status_perawat' => (int)($ps->status_perawat ?? 0),
            'status_dokter'  => (int)($ps->status_dokter ?? 0),
            'status_bidan'   => (int)($ps->status_bidan ?? 0),
        ];
    }

    /**
     * Ensure row exists and update given fields.
     */
    public function perbaruiStatus(string $nomorRegister, array $fields): Pelayanan_status
    {
        return Pelayanan_status::updateOrCreate(['nomor_register' => $nomorRegister], $fields);
    }

    public function setStatusDaftar(string $nomorRegister, int $status): Pelayanan_status
    {
        return $this->perbaruiStatus($nomorRegister, ['status_daftar' => $status]);
    }

    public function setStatusPerawat(string $nomorRegister, int $status): Pelayanan_status
    {
        return $this->perbaruiStatus($nomorRegister, ['status_perawat' => $status]);
    }

    public function setStatusDokter(string $nomorRegister, int $status): Pelayanan_status
    {
        return $this->perbaruiStatus($nomorRegister, ['status_dokter' => $status]);
    }

    public function tandaiPerawatSelesai(string $nomorRegister): Pelayanan_status
    {
        return $this->setStatusPerawat($nomorRegister, 2);
    }

    /**
     * Lock perawat data as final (no further edits) - status 3
     */
    public function tandaiPerawatFinal(string $nomorRegister): Pelayanan_status
    {
        return $this->setStatusPerawat($nomorRegister, 3);
    }

    public function tandaiDokterBerjalan(string $nomorRegister): Pelayanan_status
    {
        // Ketika dokter mulai, tandai perawat selesai (status 3)
        return $this->perbaruiStatus($nomorRegister, [
            'status_perawat' => 3,  // Selesai dengan perawat
            'status_dokter' => 1     // Sedang dilayani dokter
        ]);
    }

    public function tandaiDokterSelesai(string $nomorRegister): Pelayanan_status
    {
        return $this->setStatusDokter($nomorRegister, 2);
    }

    /**
     * Mark dokter butuh konfirmasi (ada permintaan radiologi/lab) - status 3
     */
    public function tandaiDokterPelayananSelesai(string $nomorRegister): Pelayanan_status
    {
        return $this->setStatusDokter($nomorRegister, 3);
    }

    /**
     * Mark dokter selesai penuh (tanpa permintaan lanjutan) - status 4
     */
    public function tandaiDokterSelesaiPenuh(string $nomorRegister): Pelayanan_status
    {
        return $this->setStatusDokter($nomorRegister, 4);
    }

    /**
     * Set timestamp when patient is called to doctor.
     */
    public function setWaktuPanggilDokter(string $nomorRegister): Pelayanan_status
    {
        return $this->perbaruiStatus($nomorRegister, [
            'waktu_panggil_dokter' => now(),
        ]);
    }

    // ===== BIDAN METHODS =====

    public function setStatusBidan(string $nomorRegister, int $status): Pelayanan_status
    {
        return $this->perbaruiStatus($nomorRegister, ['status_bidan' => $status]);
    }

    public function tandaiBidanBerjalan(string $nomorRegister): Pelayanan_status
    {
        // Ketika bidan mulai, tandai perawat selesai (status 3)
        return $this->perbaruiStatus($nomorRegister, [
            'status_perawat' => 3,  // Selesai dengan perawat
            'status_bidan' => 1      // Sedang dilayani bidan
        ]);
    }

    public function tandaiBidanSelesai(string $nomorRegister): Pelayanan_status
    {
        return $this->setStatusBidan($nomorRegister, 2);
    }

    /**
     * Mark bidan butuh konfirmasi (ada permintaan radiologi/lab) - status 3
     */
    public function tandaiBidanPelayananSelesai(string $nomorRegister): Pelayanan_status
    {
        return $this->setStatusBidan($nomorRegister, 3);
    }

    /**
     * Mark bidan selesai penuh (tanpa permintaan lanjutan) - status 4
     */
    public function tandaiBidanSelesaiPenuh(string $nomorRegister): Pelayanan_status
    {
        return $this->setStatusBidan($nomorRegister, 4);
    }

    /**
     * Set timestamp when patient is called to bidan.
     */
    public function setWaktuPanggilBidan(string $nomorRegister): Pelayanan_status
    {
        return $this->perbaruiStatus($nomorRegister, [
            'waktu_panggil_bidan' => now(),
        ]);
    }
}
