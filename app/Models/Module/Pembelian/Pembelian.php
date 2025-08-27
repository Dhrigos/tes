<?php

namespace App\Models\Module\Pembelian;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pembelian extends Model
{
    use HasFactory;

    protected $table = 'pembelians';

    protected $fillable =
    [
        'jenis_pembelian',
        'nomor_faktur',
        'supplier',
        'no_po_sp',
        'no_faktur_supplier',
        'tanggal_terima_barang',
        'tanggal_faktur',
        'tanggal_jatuh_tempo',
        'pajak_ppn',
        'metode_hna',
        'sub_total',
        'total_diskon',
        'ppn_total',
        'total',
        'materai',
        'koreksi',
        'penerima_barang',
        'tgl_pembelian',
        'user_input_id',
        'user_input_nama'
    ];

    public function details()
    {
        return $this->hasMany(PembelianDetail::class, 'nomor_faktur', 'nomor_faktur');
    }
}
