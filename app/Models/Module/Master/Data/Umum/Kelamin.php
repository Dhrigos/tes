<?php

namespace App\Models\Module\Master\Data\Umum;

use Illuminate\Database\Eloquent\Model;

class Kelamin extends Model
{
    protected $table = 'kelamins';
    protected $fillable = ['nama'];
}
