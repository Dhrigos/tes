<?php

namespace App\Models\Module\Master\Data\Gudang;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting_Harga_Jual extends Model
{
    use HasFactory;

    protected $table = 'setting__harga__juals';

    protected $fillable = [
        'harga_jual_1',
        'harga_jual_2',
        'harga_jual_3',
        'embalase_poin',
    ];

    // Enable timestamps
    public $timestamps = true;
}
