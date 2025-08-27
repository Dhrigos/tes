<?php

namespace Database\Seeders;

use App\Models\Settings\Set_Bpjs;
use Illuminate\Database\Seeder;

class SetBpjsSeeder extends Seeder
{
    public function run(): void
    {
        Set_Bpjs::create([
            'KPFK' => 'SAMPLE_KPFK',
            'CONSID' => 'SAMPLE_CONSID',
            'USERNAME' => 'sample_username',
            'PASSWORD' => 'sample_password',
            'SECRET_KEY' => 'sample_secret_key',
            'USER_KEY' => 'sample_user_key',
            'APP_CODE' => 'sample_app_code',
            'BASE_URL' => 'https://apijkn.bpjs-kesehatan.go.id',
            'SERVICE' => 'https://apijkn.bpjs-kesehatan.go.id/vclaim-rest',
            'SERVICE_ANTREAN' => 'https://apijkn.bpjs-kesehatan.go.id/antrean-rs',
        ]);
    }
}
