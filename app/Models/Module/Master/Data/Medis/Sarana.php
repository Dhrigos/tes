<?php

namespace App\Models\Module\Master\Data\Medis;

use Illuminate\Database\Eloquent\Model;

class Sarana extends Model
{
    protected $table = 'saranas';
    protected $fillable = ['nama', 'kode'];
}
