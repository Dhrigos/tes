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
    ];
}


