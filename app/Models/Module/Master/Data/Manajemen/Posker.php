<?php

namespace App\Models\Module\Master\Data\Manajemen;

use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Role;

class Posker extends Model
{
    protected $fillable = ['nama'];

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'posker_role', 'posker_id', 'role_id');
    }
}
