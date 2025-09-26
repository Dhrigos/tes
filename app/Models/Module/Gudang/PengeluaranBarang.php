<?php

namespace App\Models\Module\Gudang;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Module\Master\Data\Gudang\Supplier;

class PengeluaranBarang extends Model
{
    use HasFactory;

    protected $table = 'pengeluaran_barang';

    protected $fillable = [
        'jenis_pengeluaran',
        'supplier_id',
        'keterangan',
        'tanggal_return',
        'kode_barang_keluar',
        'nama_pemeriksa',
        'nama_approver',
        'pembelian_id',
    ];

    public function items()
    {
        return $this->hasMany(PengeluaranBarangItem::class, 'pengeluaran_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }
}


