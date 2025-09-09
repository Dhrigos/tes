<?php

namespace App\Models\Settings;

use Illuminate\Database\Eloquent\Model;

class Set_Sehat extends Model
{
    protected $table = 'set_sehats';

    protected $fillable = [
        'org_id',
        'client_id',
        'client_secret',      
    ];

    protected $hidden = [
        'client_secret',        
    ];
}
