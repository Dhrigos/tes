<?php

namespace App\Models\Module\Master\Data\Medis;

use Illuminate\Database\Eloquent\Model;

class Subspesialis extends Model
{
    protected $table = 'subspesialis';
    protected $fillable = ['nama', 'kode', 'kode_rujukan', 'id_spesialis'];

    public function spesialis()
    {
        return $this->belongsTo(Spesialis::class, 'id_spesialis');
    }
}
