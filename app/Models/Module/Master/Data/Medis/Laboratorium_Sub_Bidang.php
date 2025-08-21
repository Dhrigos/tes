<?php

namespace App\Models\Module\Master\Data\Medis;

use Illuminate\Database\Eloquent\Model;

class Laboratorium_Sub_Bidang extends Model
{
    protected $table = 'laboratorium_sub_bidangs';
    protected $fillable = ['nama', 'id_laboratorium_bidang'];

    public function laboratorium_bidang()
    {
        return $this->belongsTo(Laboratorium_Bidang::class, 'id_laboratorium_bidang');
    }
}
