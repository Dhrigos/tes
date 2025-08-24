<?php

namespace App\Models\Module\Master\Data\Medis;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Radiologi_Pemeriksaan extends Model
{
    protected $table = 'radiologi_pemeriksaans';
    protected $fillable = ['nama', 'id_jenis'];

    public function jenis(): BelongsTo
    {
        return $this->belongsTo(Radiologi_Jenis::class, 'id_jenis');
    }
}
