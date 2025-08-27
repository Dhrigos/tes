<?php

namespace App\Models\Module\Master\Data\Gudang;

use Illuminate\Database\Eloquent\Model;

class Daftar_Obat extends Model
{
    protected $table = 'daftar__obats';

    protected $fillable = [
        'kode',
        'nama',
        'nama_dagang',
        'jenis_formularium',
        'kfa_kode',
        'nama_industri',
        'satuan_kecil',
        'nilai_satuan_kecil',
        'satuan_sedang',
        'nilai_satuan_sedang',
        'satuan_besar',
        'nilai_satuan_besar',
        'penyimpanan',
        'barcode',
        'gudang_kategori',
        'jenis_obat',
        'jenis_generik',
        'merek',
        'bentuk_obat',
    ];
}


