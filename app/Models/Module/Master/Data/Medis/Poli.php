<?php

namespace App\Models\Module\Master\Data\Medis;

use App\Models\Module\Master\Data\Umum\Loket;
use Illuminate\Database\Eloquent\Model;

class Poli extends Model
{
    protected $table = 'polis';
    protected $fillable = ['nama', 'kode', 'jenis'];

    // Relasi dengan Loket
    public function loket()
    {
        return $this->hasOne(Loket::class, 'poli_id', 'id');
    }

    // Relasi dengan banyak Loket (jika satu poli bisa punya banyak loket)
    public function lokets()
    {
        return $this->hasMany(Loket::class, 'poli_id', 'id');
    }
}
