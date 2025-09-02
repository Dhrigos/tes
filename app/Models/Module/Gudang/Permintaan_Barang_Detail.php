<?php

namespace App\Models\Module\Gudang;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Permintaan_Barang_Detail extends Model
{
    use HasFactory;

    protected $table = 'permintaan_barang_details';

    protected $fillable = [
        'kode_request',
        'kode_obat_alkes',
        'nama_obat_alkes',
        'qty',
    ];

    public function permintaanBarang()
    {
        return $this->belongsTo(Permintaan_Barang::class, 'kode_request', 'kode_request');
    }
}
