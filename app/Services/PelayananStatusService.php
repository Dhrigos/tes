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
        return $this->setStatusDokter($nomorRegister, 1);
    }

    public function tandaiDokterSelesai(string $nomorRegister): Pelayanan_status
    {
        return $this->setStatusDokter($nomorRegister, 2);
    }

    /**
     * Mark dokter complete (pelayanan selesai) - status 3
     */
    public function tandaiDokterPelayananSelesai(string $nomorRegister): Pelayanan_status
    {
        return $this->setStatusDokter($nomorRegister, 3);
    }
}


