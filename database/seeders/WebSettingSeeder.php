<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class WebSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('set_bpjs')->insert([
            'CONSID'            => '123456789',
            'USERNAME'          => 'admin',
            'PASSWORD'          => bcrypt('password123'),
            'SECRET_KEY'        => 'your-secret-key',
            'USER_KEY'          => 'your-user-key',
            'APP_CODE'          => 'APP001',
            'BASE_URL'          => 'https://example.com/api',
            'SERVICE'           => 'service-name',
            'SERVICE_ANTREAN'   => 'service-antrean',
            'KPFK'              => 'kpfk-value',
            'created_at'        => now(),
            'updated_at'        => now(),
        ]);

        // Seed kedua: Table kedua
        DB::table('set_sehats')->insert([
            'org_id'             => 'ORG123',
            'client_id'          => 'your-client-id',
            'client_secret'      => 'your-client-secret',
            'SECRET_KEY'         => 'another-secret-key',
            'SATUSEHAT_BASE_URL' => 'https://api.satusehat.kemkes.go.id',
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        // Seed ketiga: Table ketiga
        DB::table('web_settings')->insert([
            'id'            => 1,
            'nama'          => 'Tekno App',
            'alamat'        => 'Jl. Merdeka No. 123, Jakarta',
            'profile_image' => 'default.png',
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);
    }
}
