<?php

namespace App\Models\Module\SDM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PerawatPendidikan extends Model
{
    use HasFactory;

    protected $table = 'perawat_pendidikans';

    protected $fillable = [
        'perawat_id',
        'jenjang',
        'institusi',
        'tahun_lulus',
        'nomor_ijazah',
        'file_ijazah',
    ];
}
