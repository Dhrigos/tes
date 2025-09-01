<?php

namespace App\Models\Module\Pelayanan;

// use App\Models\Module\Apotek\Apotek;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Obat;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter;
use Illuminate\Database\Eloquent\Model;

class Pelayanan_Soap_Dokter_Tindakan extends Model
{
    protected $table = 'pelayanan_soap_dokter_tindakans';

    protected $fillable = [
        'nomor_rm',
        'nama',
        'no_rawat',
        'seks',
        'penjamin',
        'tanggal_lahir',
        'jenis_tindakan',
        'jenis_pelaksana',
        'harga',
        'status_kasir',
    ];

    // public function apotek()
    // {
    //     return $this->belongsTo(Apotek::class, 'no_rawat', 'no_rawat');
    // }

    public function cek_resep()
    {
        return $this->belongsTo(Pelayanan_Soap_Dokter_Obat::class, 'no_rawat', 'no_rawat');
    }

    public function data_soap()
    {
        return $this->belongsTo(Pelayanan_Soap_Dokter::class, 'no_rawat', 'no_rawat');
    }
}
