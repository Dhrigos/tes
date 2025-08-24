<?php

namespace App\Models\Module\Pemdaftaran;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pendaftaran extends Model
{
        use HasFactory;
    protected $fillable =
    [
        'nomor_rm',
        'pasien_id',
        'nomor_register',
        'tanggal_kujungan',
        'poli_id',
        'dokter_id',
        'Penjamin',
        'antrian',
        'no_urut'
    ];
}
