<?php

namespace App\Models\Module\Kasir;

use Illuminate\Database\Eloquent\Model;

class Kasir_Detail extends Model
{
    protected $table = 'kasir_details';

    protected $fillable = [
        'kode_faktur',
        'no_rawat',
        'no_rm',
        'nama_obat_tindakan',
        'harga_obat_tindakan',
        'pelaksana',
        'qty',
        'subtotal',
        'nama_diskon',
        'harga_diskon',
        'total',
        'tanggal',
    ];

    public function kasir()
    {
        return $this->belongsTo(Kasir::class, 'kode_faktur', 'kode_faktur');
    }
}
