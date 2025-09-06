<?php

namespace App\Models\Module\Pelayanan;

use Illuminate\Database\Eloquent\Model;

class Odontogram_Detail extends Model
{

    protected $table = 'odontogram_details';

    protected $fillable = [
        'nomor_rm',
        'nama',
        'no_rawat',
        'sex',
        'penjamin',
        'tanggal_lahir',
        'Decayed',
        'Missing',
        'Filled',
        'Oclusi',
        'Palatinus',
        'Mandibularis',
        'Platum',
        'Diastema',
        'Anomali',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
