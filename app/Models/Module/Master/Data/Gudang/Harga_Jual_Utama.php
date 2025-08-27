<?php

namespace App\Models\Module\Master\Data\Gudang;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Harga_Jual_Utama extends Model
{
    use HasFactory;

    protected $table = 'harga_jual_utamas';

    protected $fillable = [
        'nama_template',
        'harga_jual_1',
        'harga_jual_2',
        'harga_jual_3',
        'embalase_poin',
        'deskripsi',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Enable timestamps
    public $timestamps = true;
}
