<?php

namespace App\Models\Module\Master\Data\Medis;

use Illuminate\Database\Eloquent\Model;

class Htt_Subpemeriksaan extends Model
{
    protected $table = 'htt_subpemeriksaans';
    protected $fillable = ['nama', 'id_htt_pemeriksaan'];

    public function htt_pemeriksaan()
    {
        return $this->belongsTo(Htt_Pemeriksaan::class, 'id_htt_pemeriksaan');
    }
}
