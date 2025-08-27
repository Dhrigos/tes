<?php

namespace App\Models\Module\SDM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DokterJadwal extends Model
{
    use HasFactory;

    protected $table = 'dokter_jadwals';

    protected $fillable = [
        'dokter_id',
        'hari',
        'jam_mulai',
        'jam_selesai',
        'kuota',
        'aktif',
    ];
}


