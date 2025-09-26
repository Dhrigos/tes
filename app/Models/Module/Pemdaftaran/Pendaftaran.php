<?php

namespace App\Models\Module\Pemdaftaran;

use App\Models\Module\Master\Data\Medis\Poli;
use App\Models\Module\Master\Data\Umum\Penjamin;
use App\Models\Module\Pasien\Pasien;
use App\Models\Module\SDM\Dokter;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter;
use App\Models\Module\Pelayanan\Pelayanan_So_Perawat;
use App\Models\Module\Pelayanan\Pelayanan_status;
use App\Models\Module\Apotek\Apotek;
use Illuminate\Database\Eloquent\Model;




class Pendaftaran extends Model
{
    protected $table = 'pendaftarans';
    protected $fillable = [
        'nomor_rm',
        'pasien_id',
        'nomor_register',
        'tanggal_kujungan',
        'poli_id',
        'dokter_id',
        'Penjamin',
        'antrian',
        'no_urut',
        'alasan_batal',
        'status'
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

    public function penjamin()
    {
        return $this->belongsTo(Penjamin::class, 'Penjamin');
    }

    public function soap_dokter()
    {
        return $this->hasOne(Pelayanan_Soap_Dokter::class, 'no_rawat', 'nomor_register');
    }

    public function so_perawat()
    {
        return $this->hasOne(Pelayanan_So_Perawat::class, 'no_rawat', 'nomor_register');
    }

    public function status()
    {
        return $this->hasOne(Pendaftaran_status::class, 'register_id');
    }

    // Waktu Panggil Dokter dari tabel pelayanan_statuses (by nomor_register)
    public function pelayanan_statuses()
    {
        return $this->hasOne(Pelayanan_status::class, 'nomor_register', 'nomor_register');
    }

    // Data apotek terkait (by no_rawat = nomor_register)
    public function apoteks()
    {
        return $this->hasMany(Apotek::class, 'no_rawat', 'nomor_register');
    }
}
