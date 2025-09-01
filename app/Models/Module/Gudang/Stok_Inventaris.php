<?php

namespace App\Models\Module\Gudang;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Stok_Inventaris extends Model
{
    use HasFactory;

    protected $table = 'stok_inventaris';

    protected $fillable = [
        'kode_pembelian',
        'kode_barang',
        'nama_barang',
        'kategori_barang',
        'jenis_barang',
        'qty_barang',
        'harga_barang',
        'masa_akhir_penggunaan',
        'tanggal_pembelian',
        'detail_barang',
        'lokasi',
        'penanggung_jawab',
        'kondisi',
        'no_seri',
        'user_input_id',
        'user_input_name'
    ];
}
