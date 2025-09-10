<?php

namespace App\Models\Module\Pelayanan;

use Illuminate\Database\Eloquent\Model;

class Pelayanan_Soap_Konfirmasi extends Model
{
    protected $table = 'pelayanan_soap_konfirmasi';

    protected $fillable = [
        'nomor_rm',
        'nama',
        'no_rawat',
        'seks',
        'penjamin',
        'tanggal_lahir',
        'umur',
        'keterangan',
    ];

    public function files()
    {
        return $this->hasMany(Pelayanan_Soap_Konfirmasi_File::class, 'konfirmasi_id');
    }
}


