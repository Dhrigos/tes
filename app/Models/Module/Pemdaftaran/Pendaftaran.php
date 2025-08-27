<?php

namespace App\Models\Module\Pemdaftaran;

use App\Models\Module\Master\Data\Medis\Poli;
use App\Models\Module\Master\Data\Umum\Penjamin;
use App\Models\Module\Pasien\Pasien;
use App\Models\Module\SDM\Dokter;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;




class Pendaftaran extends Model
{
    use HasFactory;

    protected $fillable = [
        'nomor_rm',
        'pasien_id',
        'nomor_register',
        'tanggal_kujungan',
        'poli_id',
        'dokter_id',
        'penjamin_id',
        'antrian',
        'no_urut'
    ];

    public function poli()
    {
        return $this->belongsTo(Poli::class, 'poli_id');
    }

    public function dokter()
    {
        return $this->belongsTo(Dokter::class, 'dokter_id');
    }

    public function pasien()
    {
        return $this->belongsTo(Pasien::class, 'pasien_id');
    }

    public function penjamin()
    {
        return $this->belongsTo(Penjamin::class, 'penjamin_id');
    }

    public function status()
    {
        return $this->hasOne(Pendaftaran_status::class, 'register_id');
    }
}
