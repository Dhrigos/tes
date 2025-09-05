<?php

namespace App\Models\Module\Pelayanan;

use Illuminate\Database\Eloquent\Model;

class Odontogram extends Model
{
    protected $table = 'odontograms';

    protected $fillable = [
        'nomor_rm',
        'nama',
        'no_rawat',
        'sex',
        'penjamin',
        'tanggal_lahir',
        'tooth_number',
        'condition',
        'note',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
