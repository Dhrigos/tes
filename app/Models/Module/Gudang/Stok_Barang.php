<?php

namespace App\Models\Module\Gudang;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Stok_Barang extends Model
{
    use HasFactory;

    protected $table = 'stok_barangs';

    protected $fillable = [
        'kode_obat_alkes',
        'nama_obat_alkes',
        'qty',
        'tanggal_terima_obat',
        'expired',
        'nomor_seri',
        'user_input_id',
        'user_input_name',
    ];
}
