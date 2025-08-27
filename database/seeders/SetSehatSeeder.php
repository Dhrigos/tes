<?php

namespace Database\Seeders;

use App\Models\Settings\Set_Sehat;
use Illuminate\Database\Seeder;

class SetSehatSeeder extends Seeder
{
    public function run(): void
    {
        Set_Sehat::create([
            'org_id' => 'sample_org_id',
            'client_id' => 'sample_client_id',
            'client_secret' => 'sample_client_secret',
            'SECRET_KEY' => 'sample_secret_key',
            'SATUSEHAT_BASE_URL' => 'https://api.satusehat.kemkes.go.id',
        ]);
    }
}
