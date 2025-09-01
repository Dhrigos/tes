<?php

namespace App\Models\Module\Pelayanan;

use App\Models\Module\Master\Data\Medis\Poli;
use App\Models\Module\Pasien\Pasien;
use App\Models\Module\Pelayanan\Pelayanan_So_Perawat;
use App\Models\Module\Pemdaftaran\Pendaftaran;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Icd;
use App\Models\Module\SDM\Dokter;
use Illuminate\Database\Eloquent\Model;

class Pelayanan extends Model
{

    protected $table = "pelayanans";
    protected $fillable =
    [
        'nomor_rm',
        'pasien_id',
        'nomor_register',
        'tanggal_kujungan',
        'poli_id',
        'dokter_id',
        'kunjungan',
    ];

    public function poli()
    {
        return $this->belongsTo(Poli::class, 'poli_id');
    }

    public function dokter()
    {
        return $this->belongsTo(Dokter::class, 'dokter_id');
    }
    public function pasien()
    {
        return $this->belongsTo(Pasien::class, 'pasien_id');
    }

    public function pendaftaran()
    {
        return $this->belongsTo(Pendaftaran::class, 'nomor_register', 'nomor_register');
    }

    public function pelayanan_so()
    {
        return $this->hasMany(Pelayanan_So_Perawat::class,  'no_rawat', 'nomor_register');
    }
    public function pelayanan_soap()
    {
        return $this->hasMany(Pelayanan_Soap_Dokter::class, 'no_rawat', 'nomor_register');
    }

    public function icd()
    {
        return $this->hasOne(Pelayanan_Soap_Dokter_Icd::class, 'no_rawat', 'nomor_register');
    }
}
