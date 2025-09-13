<?php

namespace App\Models\Module\Pelayanan;

use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter;
use Illuminate\Database\Eloquent\Model;

class Pelayanan_Soap_Dokter_Obat extends Model
{
    protected $table = 'pelayanan_soap_dokter_obats';

    protected $fillable = [
        'nomor_rm',
        'nama',
        'no_rawat',
        'seks',
        'penjamin',
        'tanggal_lahir',
        'penanda',
        'nama_obat',
        'jumlah_diberikan',
        'instruksi',
        'signa',
        'satuan_gudang',
        'satuan_signa',
        'penggunaan',
        'dtd',
        'dtd_mode',
    ];

    public function pelayanan()
    {
        return $this->belongsTo(Pelayanan_Soap_Dokter::class, 'no_rawat', 'no_rawat');
    }
}
