<?php

namespace App\Models\Module\Master\Data\Medis;

use Illuminate\Database\Eloquent\Model;

class Alergi extends Model
{
    protected $table = 'alergis';
    protected $fillable = ['kode', 'jenis_alergi', 'nama'];
}
