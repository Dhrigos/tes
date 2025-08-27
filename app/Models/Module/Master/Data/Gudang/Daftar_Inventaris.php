<?php

namespace App\Models\Module\Master\Data\Gudang;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Daftar_Inventaris extends Model
{
    use HasFactory;

    protected $table = 'daftar_inventaris';
    protected $fillable = [
        'kode_barang',
        'nama_barang',
        'kategori_barang',
        'satuan_barang',
        'jenis_barang',
        'masa_pakai_barang',
        'masa_pakai_waktu_barang',
        'deskripsi_barang',
    ];
}
