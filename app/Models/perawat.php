<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Module\Master\Data\Manajemen\Posker;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\Village;

class perawat extends Model
{
    protected $table = 'perawats';
    protected $fillable = [
        'nama',
        'nik',
        'npwp',
        'tgl_masuk',
        'status_pegawaian',
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
        'profile',
        'verifikasi',
    ];

    public function namastatuspegawai()
    {
        return $this->belongsTo(Posker::class, 'status_pegawaian');
    }

    public function provinsi()
    {
        return $this->belongsTo(Province::class, 'provinsi_kode', 'code');
    }

    public function kabupaten()
    {
        return $this->belongsTo(City::class, 'kabupaten_kode', 'code');
    }

    public function kecamatan()
    {
        return $this->belongsTo(District::class, 'kecamatan_kode', 'code');
    }

    public function desa()
    {
        return $this->belongsTo(Village::class, 'desa_kode', 'code');
    }
}
