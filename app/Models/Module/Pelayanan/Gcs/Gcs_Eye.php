<?php

namespace App\Models\Module\Pelayanan\Gcs;

use Illuminate\Database\Eloquent\Model;

class Gcs_Eye extends Model
{
    protected $table = 'gcs_eyes';
    
    protected $fillable = [
        'nama',
        'skor',
    ];
}
