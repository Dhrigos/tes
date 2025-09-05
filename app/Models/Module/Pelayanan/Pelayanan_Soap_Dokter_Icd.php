<?php

namespace App\Models\Module\Pelayanan;

use Illuminate\Database\Eloquent\Model;

class Pelayanan_Soap_Dokter_Icd extends Model
{
    protected $table = 'pelayanan_soap_dokter_icds';
    
    protected $fillable = [
        'nomor_rm',
        'nama',
        'no_rawat',
        'seks',
        'penjamin',
        'tanggal_lahir',
        'nama_icd10',
        'kode_icd10',
        'priority_icd10',
        'nama_icd9',
        'kode_icd9',
    ];
}
