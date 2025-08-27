<?php

namespace App\Models\Module\Pembelian;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PembelianDetail extends Model
{
    use HasFactory;

    protected $table = 'pembelian_details';

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
        return $this->belongsTo(Pembelian::class, 'nomor_faktur', 'nomor_faktur');
    }
}
