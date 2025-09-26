<?php

namespace App\Models\Module\Master\Data\Medis;

use Illuminate\Database\Eloquent\Model;

class Spesialis extends Model
{
    protected $table = 'spesialis';
    protected $fillable = ['nama', 'kode'];

    public function subspesialis()
    {
        return $this->hasMany(Subspesialis::class, 'id_spesialis');
    }
}
