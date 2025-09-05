<?php

namespace App\Models\Module\Apotek;

use Illuminate\Database\Eloquent\Model;

class Apotek_Prebayar extends Model
{
    protected $table = 'apotek_prebayars';

    protected $fillable = [
        'kode_faktur',
        'no_rm',
        'nama',
        'tanggal',
        'nama_obat_alkes',
        'kode_obat_alkes',
        'harga',
        'qty',
        'total',
    ];
}
