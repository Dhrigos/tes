<?php

namespace App\Models\Module\Pelayanan;

use Illuminate\Database\Eloquent\Model;

class Pelayanan_Permintaan extends Model
{
    protected $table = 'pelayanan_permintaans';

    protected $fillable = [
        'nomor_rm',
        'no_rawat',
        'jenis_permintaan',
        'detail_permintaan',
        'tanggal_permintaan',
        'status',
        'user_input_id',
        'user_input_name',
    ];

    protected $casts = [
        'detail_permintaan' => 'array',
        'tanggal_permintaan' => 'date',
    ];
}
