<?php

namespace App\Models\Module\Pemdaftaran;

use App\Models\Module\Pasien\Pasien;
use Illuminate\Database\Eloquent\Model;

class Antrian_Pasien extends Model
{
    protected $fillable = [
        'pasien_id',
        'prefix',
        'nomor',
        'tanggal',
    ];

    /**
     * Relasi ke pasien
     */
    public function pasien()
    {
        return $this->belongsTo(Pasien::class);
    }

}
