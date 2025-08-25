<?php

namespace App\Models\Module\Master\Data\Umum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Loket extends Model
{
        use HasFactory;
    protected $fillable = ['nama', 'poli_id'];

}
