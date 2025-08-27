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
        'SECRET_KEY',
        'SATUSEHAT_BASE_URL',
    ];

    protected $hidden = [
        'client_secret',
        'SECRET_KEY',
    ];
}
