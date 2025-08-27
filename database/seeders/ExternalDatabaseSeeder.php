<?php

namespace Database\Seeders;

use App\Models\Settings\External_Database;
use Illuminate\Database\Seeder;

class ExternalDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        External_Database::create([
            'name' => 'Gudang Utama',
            'host' => '127.0.0.1',
            'database' => 'gudang_utama',
            'username' => 'root',
            'password' => '',
            'port' => 3306,
            'active' => true,
        ]);

        External_Database::create([
            'name' => 'Gudang Cabang 1',
            'host' => '127.0.0.1',
            'database' => 'gudang_cabang_1',
            'username' => 'root',
            'password' => '',
            'port' => 3306,
            'active' => false,
        ]);

        External_Database::create([
            'name' => 'Gudang Cabang 2',
            'host' => '127.0.0.1',
            'database' => 'gudang_cabang_2',
            'username' => 'root',
            'password' => '',
            'port' => 3306,
            'active' => false,
        ]);
    }
}
