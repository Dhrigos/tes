<?php

namespace App\Models\Module\Pelayanan;

use Illuminate\Database\Eloquent\Model;

class Pelayanan_status extends Model
{
    protected $table = 'pelayanan_statuses';

    protected $fillable = [
        'nomor_register',
        'pasien_id',
        'tanggal_kujungan',
        'status_daftar',
        'status_perawat',
        'status_dokter',
        'status_bidan',
        'waktu_panggil_dokter',
        'waktu_panggil_bidan',
    ];

    protected $casts = [
        'waktu_panggil_dokter' => 'datetime',
        'waktu_panggil_bidan' => 'datetime',
    ];
}
