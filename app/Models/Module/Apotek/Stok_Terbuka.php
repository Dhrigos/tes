<?php

namespace App\Models\Module\Apotek;

use Illuminate\Database\Eloquent\Model;

class Stok_Terbuka extends Model
{
    protected $table = 'stok_terbukas';

    protected $fillable = [
        'kode_obat',
        'nama_obat',
        'volume',
        'satuan',
        'tanggal_kadaluarsa',
        'ukuran'
    ];
}
