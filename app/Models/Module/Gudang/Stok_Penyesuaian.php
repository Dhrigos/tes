<?php

namespace App\Models\Module\Gudang;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Stok_Penyesuaian extends Model
{
    use HasFactory;

    protected $table = 'stok_penyesuaians';

    protected $fillable = [
        'kode_obat',
        'nama_obat',
        'qty_sebelum',
        'qty_mutasi',
        'qty_sesudah',
        'jenis_penyesuaian',
        'alasan',
        'jenis_gudang',
        'user_input_name',
    ];
}
