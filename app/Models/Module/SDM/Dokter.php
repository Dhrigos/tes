<?php

namespace App\Models\Module\SDM;

use App\Models\Module\Master\Data\Manajemen\Posker;
use App\Models\Module\Master\Data\Medis\Poli;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dokter extends Model
{
    protected $table = 'dokters';
    protected $fillable = [
        'nama',
        'nik',
        'npwp',
        'poli',
        'kode',
        'kode_satu',
        'tgl_masuk',
        'status_pegawaian',
        'sip',
        'exp_spri',
        'str',
        'exp_str',
        'tempat_lahir',
        'tanggal_lahir',
        'alamat',
        'rt',
        'rw',
        'kode_pos',
        'kewarganegaraan',
        'seks',
        'agama',
        'pendidikan',
        'goldar',
        'pernikahan',
        'telepon',
        'provinsi_kode',
        'kabupaten_kode',
        'kecamatan_kode',
        'desa_kode',
        'suku',
        'bahasa',
        'bangsa',
        'verifikasi',
        'users',
    ];


    public function namauser()
    {
        return $this->belongsTo(User::class, 'users');
    }
    public function namapoli()
    {
        return $this->belongsTo(Poli::class, 'poli');
    }
    public function namastatuspegawai()
    {
        return $this->belongsTo(Posker::class, 'status_pegawaian');
    }

    public function pendidikans()
    {
        return $this->hasMany(\App\Models\Module\SDM\DokterPendidikan::class, 'dokter_id');
    }

    public function pelatihans()
    {
        return $this->hasMany(\App\Models\Module\SDM\DokterPelatihan::class, 'dokter_id');
    }

    public function jadwals()
    {
        return $this->hasMany(\App\Models\Module\SDM\DokterJadwal::class, 'dokter_id');
    }

    // public function verifikasi()
    // {
    //     return $this->hasOne(dokter_verifikasi::class);
    // }

    public function jadwal()
    {
        return $this->hasMany(DokterJadwal::class, 'dokter_id');
    }

    // public function pendaftaran()
    // {
    //     return $this->hasMany(Pendaftaran_rawat_jalan::class, 'dokter_id');
    // }
}
