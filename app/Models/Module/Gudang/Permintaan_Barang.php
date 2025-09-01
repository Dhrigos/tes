<?php

namespace App\Models\Module\Gudang;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Permintaan_Barang extends Model
{
    use HasFactory;

    protected $table = 'permintaan_barangs';
    protected $fillable = [
        'kode_request',
        'kode_klinik',
        'nama_klinik',
        'status',
        'tanggal_input',
    ];

    public function details()
    {
        return $this->hasMany(Permintaan_Barang_Detail::class, 'kode_request', 'kode_request');
    }
}
