<?php

namespace App\Models\Module\Pasien;

use Illuminate\Database\Eloquent\Model;
use App\Models\Module\Pasien\Pasien;

class Pasien_History extends Model
{
    protected $table = 'pasien_histories';
    protected $fillable = [
        'no_rm',
        'nama',
        'history',
    ];
    protected $casts = [
        'history' => 'array',
    ];

    public function pasien()
    {
        return $this->belongsTo(Pasien::class, 'no_rm', 'no_rm');
    }
}
