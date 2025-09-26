<?php

namespace App\Models\Module\Master\Data\Medis;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Radiologi_Jenis extends Model
{
    protected $table = 'radiologi_jenis';
    protected $fillable = ['nama'];

    public function pemeriksaans(): HasMany
    {
        return $this->hasMany(Radiologi_Pemeriksaan::class, 'id_jenis');
    }
}
