<?php

namespace App\Models\Module;

use App\Models\Module\Master\Data\Medis\Poli;
use App\Models\Module\Pasien\Pasien;
use App\Models\Module\Pemdaftaran\Pendaftaran;
use App\Models\Module\SDM\Dokter;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Pelayanan extends Model
{
    use HasFactory;
    protected $fillable =
    [
        'nomor_rm',
        'pasien_id',
        'nomor_register',
        'tanggal_kujungan',
        'poli_id',
        'dokter_id',
        'kunjungan',
        'status',
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

    // public function pelayanan_so()
    // {
    //     return $this->hasMany(pelayanan_soap_perawat::class,  'no_rawat', 'nomor_register');
    // }
    // public function pelayanan_soap()
    // {
    //     return $this->hasMany(pelayanan_soap_dokter::class, 'no_rawat', 'nomor_register');
    // }

    // public function icd()
    // {
    //     return $this->hasOne(pelayanan_soap_dokter_icd::class, 'no_rawat', 'nomor_register');
    // }

}
