<?php

namespace App\Models\Module\Apotek;

use Illuminate\Database\Eloquent\Model;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Tindakan;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter;

class Apotek extends Model
{
    protected $table = 'apoteks';

    protected $fillable = [
        'kode_faktur',
        'no_rm',
        'no_rawat',
        'nama',
        'alamat',
        'tanggal',
        'jenis_resep',
        'jenis_rawat',
        'poli',
        'dokter',
        'penjamin',
        'embalase_poin',
        'sub_total',
        'embis_total',
        'total',
        'note_apotek',
        'status_kasir',
    ];

    public function detail_obat()
    {
        return $this->hasMany(Apotek_Prebayar::class, 'kode_faktur', 'kode_faktur');
    }

    public function detail_tindakan()
    {
        return $this->hasMany(Pelayanan_Soap_Dokter_Tindakan::class, 'no_rawat', 'no_rawat');
    }

    public function data_soap()
    {
        return $this->belongsTo(Pelayanan_Soap_Dokter::class, 'no_rawat', 'no_rawat');
    }
}
