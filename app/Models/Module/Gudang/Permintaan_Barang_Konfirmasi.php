<?php

namespace App\Models\Module\Gudang;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Permintaan_Barang_Konfirmasi extends Model
{
    use HasFactory;

    protected $fillable = [
        'kode_request',
        'nama_klinik',
        'tanggal_request',
        'kode_obat_alkes',
        'nama_obat_alkes',
        'harga_dasar',
        'qty',
        'tanggal_terima_obat',
        'expired',
        'user_input_id',
        'user_input_name',
    ];
}
