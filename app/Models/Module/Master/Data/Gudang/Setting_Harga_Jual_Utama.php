<?php

namespace App\Models\Module\Master\Data\Gudang;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting_Harga_Jual_Utama extends Model
{
    protected $table = 'setting_harga_jual_utamas';

    protected $fillable = [
        'harga_jual_1',
        'harga_jual_2',
        'harga_jual_3',
    ];

    // Enable timestamps
    public $timestamps = true;
}
