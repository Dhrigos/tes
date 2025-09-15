<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posker_role', function (Blueprint $table) {
            $table->unsignedBigInteger('posker_id');
            $table->unsignedBigInteger('role_id');
            $table->primary(['posker_id', 'role_id']);
            $table->index(['role_id'], 'posker_role_role_id_foreign');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('posker_role');
    }
};
