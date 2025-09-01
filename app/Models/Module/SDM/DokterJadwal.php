<?php

namespace App\Models\Module\SDM;

use App\Models\Module\Master\Data\Umum\Penjamin;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DokterJadwal extends Model
{
    use HasFactory;

    protected $table = 'dokter_jadwals';

    protected $fillable = [
        'dokter_id',
        'hari',
        'jam_mulai',
        'jam_selesai',
        'kuota',
        'aktif',
    ];
        public function Dokter(): BelongsTo
    {
        return $this->belongsTo(Dokter::class);
    }

}


