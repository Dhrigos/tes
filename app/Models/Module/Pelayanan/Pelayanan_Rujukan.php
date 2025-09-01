<?php

namespace App\Models\Module\Pelayanan;

use Illuminate\Database\Eloquent\Model;

class Pelayanan_Rujukan extends Model
{
    protected $table = 'pelayanan_rujukans';

    protected $fillable = [
        'nomor_rm',
        'no_rawat',
        'penjamin',
        'jenis_rujukan',
        'tujuan_rujukan',
        'opsi_rujukan',
        'tanggal_rujukan',
        'sarana',
        'rujukan_lanjut',
        'sub_spesialis',
        'user_input_id',
        'user_input_name',
    ];

    protected $casts = [
        'tanggal_rujukan' => 'date',
        'rujukan_lanjut' => 'array',
    ];
}
