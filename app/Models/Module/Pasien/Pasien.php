<?php

namespace App\Models\Module\Pasien;

use Illuminate\Database\Eloquent\Model;

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
}
