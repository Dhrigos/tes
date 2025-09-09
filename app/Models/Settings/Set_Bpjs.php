<?php

namespace App\Models\Settings;

use Illuminate\Database\Eloquent\Model;

class Set_Bpjs extends Model
{
    protected $table = 'set_bpjs';

    protected $fillable = [
        'KPFK',
        'CONSID',
        'USERNAME',
        'PASSWORD',
        'SECRET_KEY',
        'USER_KEY',        
    ];

    protected $hidden = [
        'PASSWORD',
        'SECRET_KEY',
        'USER_KEY',
    ];
}
