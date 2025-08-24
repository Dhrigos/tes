<?php

namespace App\Models\Module\Pasien;

use Illuminate\Database\Eloquent\Model;
use App\Models\Module\Master\Data\Umum\Goldar;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\Village;

class Pasien extends Model
{
    protected $fillable = [
        'no_rm',
        'nik',
        'nama',
        'kode_ihs',
        'tempat_lahir',
        'tanggal_lahir',
        'no_bpjs',
        'tgl_exp_bpjs',
        'kelas_bpjs',
        'jenis_peserta_bpjs',
        'provide',
        'kodeprovide',
        'hubungan_keluarga',
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
        'pekerjaan',
        'telepon',
        'provinsi_kode',
        'kabupaten_kode',
        'kecamatan_kode',
        'desa_kode',
        'suku',
        'bahasa',
        'bangsa',
        'verifikasi',
        'penjamin_2_nama',
        'penjamin_3_nama',
        'penjamin_2_no',
        'penjamin_3_no',
        'foto',
    ];

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

    // Relasi dengan tabel goldar
    public function goldarRelation()
    {
        return $this->belongsTo(Goldar::class, 'goldar', 'id');
    }
}
