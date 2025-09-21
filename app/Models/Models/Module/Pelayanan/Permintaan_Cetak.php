<?php

namespace App\Models\Module\Pelayanan;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Permintaan_Cetak extends Model
{
    use HasFactory;

    protected $table = 'permintaan_cetak';

    protected $fillable = [
        'no_rawat',
        'nomor_rm',
        'jenis_permintaan',
        'detail_permintaan',
        'judul',
        'keterangan',
        'status',
        'tanggal_cetak',
        'created_by',
        'printed_by',
    ];

    protected $casts = [
        'detail_permintaan' => 'array',
        'tanggal_cetak' => 'datetime',
    ];

    // Scope untuk filter berdasarkan status
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopePrinted($query)
    {
        return $query->where('status', 'printed');
    }

    public function scopeByNoRawat($query, $noRawat)
    {
        return $query->where('no_rawat', $noRawat);
    }

    public function scopeByJenis($query, $jenis)
    {
        return $query->where('jenis_permintaan', $jenis);
    }
}
