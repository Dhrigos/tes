<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class pembelian_obat_detail extends Model
{
    use HasFactory;
    protected $fillable =
    [
        'nomor_faktur',
        'nama_obat_alkes',
        'kode_obat_alkes',
        'qty',
        'harga_satuan',
        'diskon',
        'exp',
        'batch',
        'sub_total'
    ];

    public function pembelian()
    {
        return $this->belongsTo(pembelian::class, 'nomor_faktur', 'nomor_faktur');
    }
}
