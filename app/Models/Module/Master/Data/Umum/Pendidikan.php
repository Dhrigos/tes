<?php

namespace App\Models\Module\Master\Data\Umum;

use Illuminate\Database\Eloquent\Model;

class Pendidikan extends Model
{
    protected $fillable = [
        'nama',
        'singkatan',
        'level',
    ];

}
