<?php

namespace App\Models\Module\Gudang;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Stok_Obat_Klinik extends Model
{
    use HasFactory;

    protected $table = 'stok_obat_klinik';

    protected $fillable = [
        'kode_obat_alkes',
        'nama_obat_alkes',
        'qty',
        'tanggal_terima_obat',
        'expired',
        'user_input_id',
        'user_input_name',
    ];
}
