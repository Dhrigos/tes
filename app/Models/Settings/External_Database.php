<?php

namespace App\Models\Settings;

use Illuminate\Database\Eloquent\Model;

class External_Database extends Model
{
    protected $table = 'external_databases';
    protected $fillable = [
        'name',
        'host',
        'database',
        'username',
        'password',
        'port',
        'active',
    ];
}
