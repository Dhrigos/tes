<?php

namespace App\Models\Module\SDM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DokterPendidikan extends Model
{
    use HasFactory;

    protected $table = 'dokter_pendidikans';

    protected $fillable = [
        'dokter_id',
        'jenjang',
        'institusi',
        'tahun_lulus',
        'nomor_ijazah',
        'file_ijazah',
    ];
}


