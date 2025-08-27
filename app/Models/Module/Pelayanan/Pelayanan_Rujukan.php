<?php

namespace App\Models\Module\Pelayanan;

use Illuminate\Database\Eloquent\Model;

class Pelayanan_Rujukan extends Model
{
    protected $fillable = [
        'nomor_rm',
        'no_rawat',
        'penjamin',
        'tujuan_rujukan',
        'opsi_rujukan',
        'tanggal_rujukan',
        'sarana',
        'rujukan_lanjut',
        'sub_spesialis',
    ];
}
