<?php

namespace App\Models\Module\Master\Data\Medis;

use Illuminate\Database\Eloquent\Model;

class Tindakan extends Model
{
    protected $table = 'tindakans';
    protected $fillable = ['kode', 'nama', 'kategori', 'tarif_dokter', 'tarif_perawat', 'tarif_total'];
}
