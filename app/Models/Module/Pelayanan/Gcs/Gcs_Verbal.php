<?php

namespace App\Models\Module\Pelayanan\Gcs;

use Illuminate\Database\Eloquent\Model;

class Gcs_Verbal extends Model
{
    protected $table = 'gcs_verbals';
    
    protected $fillable = [
        'nama',
        'skor',
    ];
}
