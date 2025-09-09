<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $guard = config('auth.defaults.guard', 'web');

        // permissions
        $permissions = ['add', 'edit', 'delete'];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => $guard,
            ]);
        }

        // roles (as specified)
        $roles = [
            'Admin',
            'Pendaftaran',
            'Perawat',
            'Dokter',
            'Apoteker',
            'Kasir',
            'Manajemen',
            'Gudang',
            'Administrasi_sdm',
            'Administrasi_master_data',
        ];

        foreach ($roles as $roleName) {
            $role = Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => $guard,
            ]);
        }
    }
}
