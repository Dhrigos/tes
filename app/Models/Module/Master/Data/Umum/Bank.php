<?php

namespace App\Models\Module\Master\Data\Umum;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bank extends Model
{
    protected $fillable = ['nama'];

    /**
     * Asuransi yang menggunakan bank ini
     */
    public function asuransis(): HasMany
    {
        return $this->hasMany(Asuransi::class);
    }
}
