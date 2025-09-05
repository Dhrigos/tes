<?php

namespace App\Models\Module\Master\Data\Medis;

use Illuminate\Database\Eloquent\Model;
use App\Models\Module\Master\Data\Medis\Tindakan;

class Kategori_Tindakan extends Model
{
    protected $table = 'kategori_tindakans';

    protected $fillable = ['nama'];

    public function tindakan()
    {
        return $this->hasMany(Tindakan::class, 'kategori', 'id');
    }
}
