<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use App\Models\Module\Master\Data\Manajemen\Posker;
use App\Models\Module\SDM\Staff;
use App\Models\Module\SDM\Dokter;
use App\Models\perawat;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get user roles based on their posker (job position)
     */
    public function getRolesFromPosker(): array
    {
        // Cari staff record yang terkait dengan user ini
        // Prioritas: Staff -> Dokter -> Perawat
        $staff = Staff::where('users', $this->id)->first();
        
        if (!$staff) {
            $staff = Dokter::where('users', $this->id)->first();
        }
        
        if (!$staff) {
            $staff = perawat::where('users', $this->id)->first();
        }

        if (!$staff || !$staff->status_pegawaian) {
            return ['Admin']; // Default to Admin if no posker found
        }

        // Get posker and its roles
        $posker = Posker::with('roles')->find($staff->status_pegawaian);

        if (!$posker || !$posker->roles || $posker->roles->isEmpty()) {
            return ['Admin']; // Default to Admin if no roles found
        }

        return $posker->roles->pluck('name')->toArray();
    }
}
