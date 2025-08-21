<?php

namespace App\Models\Module\Master\Data\Umum;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Asuransi extends Model
{
    protected $fillable = [
        'nama',
        'kode',
        'jenis_asuransi',
        'verif_pasien',
        'filter_obat',
        'tanggal_mulai',
        'tanggal_akhir',
        'alamat_asuransi',
        'no_telp_asuransi',
        'faksimil',
        'pic',
        'no_telp_pic',
        'jabatan_pic',
        'bank',
        'bank_id',
        'no_rekening'
    ];

    public function bank(): BelongsTo
    {
        return $this->belongsTo(Bank::class);
    }
}
