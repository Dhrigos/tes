<?php

namespace App\Models\Module\Pelayanan\Gcs;

use Illuminate\Database\Eloquent\Model;

class Gcs_Motorik extends Model
{
    protected $table = 'gcs_motoriks';
    
    protected $fillable = [
        'nama',
        'skor',
    ];
}
