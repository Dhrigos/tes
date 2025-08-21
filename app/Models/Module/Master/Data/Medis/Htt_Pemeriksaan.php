<?php

namespace App\Models\Module\Master\Data\Medis;

use Illuminate\Database\Eloquent\Model;

class Htt_Pemeriksaan extends Model
{
    protected $table = 'htt_pemeriksaans';
    protected $fillable = ['nama_pemeriksaan'];

    public function htt_subpemeriksaans()
    {
        return $this->hasMany(Htt_Subpemeriksaan::class, 'id_htt_pemeriksaan');
    }
}
