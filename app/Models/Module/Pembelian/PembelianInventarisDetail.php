<?php

namespace App\Models\Module\Pembelian;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PembelianInventarisDetail extends Model
{
    use HasFactory;

    protected $table = 'pembelian_inventaris_details';

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
        'batch'
    ];
}
