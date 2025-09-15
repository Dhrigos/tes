<?php

namespace App\Models\Module\Pelayanan;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rujukan extends Model
{
    use HasFactory;

    protected $table = 'rujukans';

    protected $fillable = [
        'nomor_rm',
        'nomor_register',
        'penjamin',
        'jenis_rujukan',
        'tujuan_rujukan',
        'opsi_rujukan',
        'sarana',
        'kategori_rujukan',
        'alasanTacc',
        'spesialis',
        'sub_spesialis',
        'tanggal_rujukan',
        'tujuan_rujukan_spesialis',
        'igd_rujukan_khusus',
        'subspesialis_khusus',
        'tanggal_rujukan_khusus',
        'tujuan_rujukan_khusus',
    ];
}
