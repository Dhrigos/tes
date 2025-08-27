<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class pembelian_inventaris_detail extends Model
{
    use HasFactory;

    protected $fillable = [
        'kode',
        'kode_barang',
        'nama_barang',
        'kategori_barang',
        'jenis_barang',
        'qty_barang',
        'harga_barang',
        'lokasi',
        'kondisi',
        'masa_akhir_penggunaan',
        'tanggal_pembelian',
        'detail_barang',
        'user_input_id',
        'user_input_name'
    ];
}
