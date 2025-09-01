<?php

namespace App\Models\Module\Master\Data\Umum;

use App\Models\Module\Master\Data\Medis\Poli;
use Illuminate\Database\Eloquent\Model;

class Loket extends Model
{
    protected $table = "lokets";
    protected $fillable = ['nama', 'poli_id'];

    public function poli()
    {
        return $this->belongsTo(Poli::class);
    }
}
