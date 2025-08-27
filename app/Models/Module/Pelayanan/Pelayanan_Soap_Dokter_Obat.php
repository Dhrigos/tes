<?php

namespace App\Models\Module\Pelayanan;

use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter;
use Illuminate\Database\Eloquent\Model;

class Pelayanan_Soap_Dokter_Obat extends Model
{
    protected $fillable = [
        'nomor_rm',
        'nama',
        'no_rawat',
        'seks',
        'penjamin',
        'tanggal_lahir',
        'resep_obat',
    ];

    public function pelayanan()
    {
        return $this->belongsTo(Pelayanan_Soap_Dokter::class, 'no_rawat', 'no_rawat');
    }
}
