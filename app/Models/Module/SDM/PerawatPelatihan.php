<?php

namespace App\Models\Module\SDM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PerawatPelatihan extends Model
{
    use HasFactory;

    protected $table = 'perawat_pelatihans';

    protected $fillable = [
        'perawat_id',
        'nama_pelatihan',
        'penyelenggara',
        'tanggal_mulai',
        'tanggal_selesai',
        'nomor_sertifikat',
        'file_sertifikat',
    ];
}
