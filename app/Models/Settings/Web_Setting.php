<?php

namespace App\Models\Settings;

use Illuminate\Database\Eloquent\Model;

class Web_Setting extends Model
{
    protected $table = 'web_settings';
    protected $fillable = [
        'nama',
        'alamat',
        'profile_image',
        'kode_klinik',
        'is_bpjs_active',
        'is_satusehat_active',
        'is_gudangutama_active',
    ];
}
