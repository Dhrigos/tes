<?php

namespace App\Models\Module\Gudang;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Permintaan_Barang_Detail extends Model
{
    use HasFactory;

    protected $table = 'permintaan_barang_details';

    protected $fillable = [
        'kode_request',
        // Legacy columns
        'kode_obat_alkes',
        'nama_obat_alkes',
        'qty',
        // New columns used by controller/UI
        // 'kode_barang',
        // 'nama_barang',
        // 'jumlah',
        // 'satuan',
    ];
}
