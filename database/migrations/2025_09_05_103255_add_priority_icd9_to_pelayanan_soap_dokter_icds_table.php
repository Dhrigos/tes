<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Migration dibatalkan - ICD9 tidak memerlukan priority
        // Hanya ICD10 yang memiliki priority (Primary/Secondary)
    }

    public function down(): void
    {
        // No action needed
    }
};
