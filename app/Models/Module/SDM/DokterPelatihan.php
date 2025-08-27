<?php

namespace App\Models\Module\SDM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DokterPelatihan extends Model
{
    use HasFactory;

    protected $table = 'dokter_pelatihans';

    protected $fillable = [
        'dokter_id',
        'nama_pelatihan',
        'penyelenggara',
        'tanggal_mulai',
        'tanggal_selesai',
        'nomor_sertifikat',
        'file_sertifikat',
    ];
}


