<?php

namespace App\Models\Module\Gudang;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PengeluaranBarangItem extends Model
{
    use HasFactory;

    protected $table = 'pengeluaran_barang_items';

    protected $fillable = [
        'pengeluaran_id',
        'kode_obat_alkes',
        'nama_obat_alkes',
        'batch',
        'qty',
    ];
}


