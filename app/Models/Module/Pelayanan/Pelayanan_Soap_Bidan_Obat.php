<?php

namespace App\Models\Module\Pelayanan;

use Illuminate\Database\Eloquent\Model;

class Pelayanan_Soap_Bidan_Obat extends Model
{
    protected $table = 'pelayanan_soap_bidan_obats';

    protected $fillable = [
        'nomor_rm',
        'nama',
        'no_rawat',
        'seks',
        'penjamin',
        'tanggal_lahir',
        'penanda',
        'nama_obat',
        'instruksi',
        'signa',
        'satuan_gudang',
        'penggunaan',
    ];
}
