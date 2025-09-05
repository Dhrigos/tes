<?php

namespace App\Models\Module\Kasir;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Kasir extends Model
{
    use HasFactory;

    protected $table = 'kasirs';

    protected $fillable = [
        'kode_faktur',
        'no_rawat',
        'no_rm',
        'nama',
        'sex',
        'usia',
        'alamat',
        'poli',
        'dokter',
        'jenis_perawatan',
        'penjamin',
        'tanggal',
        'sub_total',
        'potongan_harga',
        'administrasi',
        'materai',
        'total',
        'tagihan',
        'kembalian',
        'payment_method_1',
        'payment_nominal_1',
        'payment_type_1',
        'payment_ref_1',
        'payment_method_2',
        'payment_nominal_2',
        'payment_type_2',
        'payment_ref_2',
        'payment_method_3',
        'payment_nominal_3',
        'payment_type_3',
        'payment_ref_3',
    ];

    public function details()
    {
        return $this->hasMany(Kasir_Detail::class, 'kode_faktur', 'kode_faktur');
    }
}
