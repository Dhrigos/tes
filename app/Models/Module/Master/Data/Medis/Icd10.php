<?php

namespace App\Models\Module\Master\Data\Medis;

use Illuminate\Database\Eloquent\Model;

class Icd10 extends Model
{
    protected $table = 'icd10s';
    protected $fillable = ['kode', 'nama', 'perlu_rujuk'];
}
