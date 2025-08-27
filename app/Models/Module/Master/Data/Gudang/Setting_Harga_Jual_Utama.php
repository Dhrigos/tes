<?php

namespace App\Models\Module\Master\Data\Gudang;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting_Harga_Jual_Utama extends Model
{
    use HasFactory;

    protected $table = 'harga_jual_utamas';

    protected $fillable = [
        'kode_obat_alkes',
        'nama_obat_alkes',
        'harga_dasar',
        'harga_jual_1',
        'harga_jual_2',
        'harga_jual_3',
        'diskon',
        'ppn',
        'tanggal_obat_masuk',
    ];

    // Enable timestamps
    public $timestamps = true;
}
