<?php

namespace App\Models\Module\Pelayanan;

use Illuminate\Database\Eloquent\Model;

class Pelayanan_Soap_Bidan_Tindakan extends Model
{
    protected $table = 'pelayanan_soap_bidan_tindakans';

    protected $fillable = [
        'nomor_rm',
        'nama',
        'no_rawat',
        'seks',
        'penjamin',
        'tanggal_lahir',
        'kode_tindakan',
        'jenis_tindakan',
        'kategori_tindakan',
        'jenis_pelaksana',
        'harga',
        'status_kasir',
    ];
}
