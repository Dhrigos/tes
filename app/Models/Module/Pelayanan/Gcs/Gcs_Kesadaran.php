<?php

namespace App\Models\Module\Pelayanan\Gcs;

use Illuminate\Database\Eloquent\Model;

class Gcs_Kesadaran extends Model
{
    protected $fillable = [
        'nama',
        'skor',
        'kode',
    ];
}
