<?php

namespace App\Models\Module\Master\Data\Medis;

use Illuminate\Database\Eloquent\Model;

class Laboratorium_Bidang extends Model
{
    protected $table = 'laboratorium_bidangs';
    protected $fillable = ['nama'];

    public function laboratorium_sub_bidangs()
    {
        return $this->hasMany(Laboratorium_Sub_Bidang::class, 'id_laboratorium_bidang');
    }
}
