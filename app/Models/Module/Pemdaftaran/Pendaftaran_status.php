<?php

namespace App\Models\Module\Pemdaftaran;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use Illuminate\Database\Eloquent\Model;

class Pendaftaran_status extends Model
{
        use HasFactory;
    protected $fillable =
    [
        'nomor_rm',
        'pasien_id',
        'nomor_register',
        'tanggal_kujungan',
        'register_id',
        'status_panggil',
        'status_pendaftaran',
        'Status_aplikasi'
    ];
        public function pendaftaran()
    {
        return $this->belongsTo(Pendaftaran::class, 'id');
    }
}
