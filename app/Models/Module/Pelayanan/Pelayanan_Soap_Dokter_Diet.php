<?php

namespace App\Models\Module\Pelayanan;

use Illuminate\Database\Eloquent\Model;

class Pelayanan_Soap_Dokter_Diet extends Model
{
    protected $table = 'pelayanan_soap_dokter_diets';

    protected $fillable = [
        'nomor_rm',
        'nama',
        'no_rawat',
        'seks',
        'penjamin',
        'tanggal_lahir',
        'jenis_diet',
        'jenis_diet_makanan',
        'jenis_diet_makanan_tidak',
    ];
}
