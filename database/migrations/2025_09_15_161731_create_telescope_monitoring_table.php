<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('telescope_monitoring', function (Blueprint $table) {
            $table->string('tag', 255);
            $table->primary('tag');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('telescope_monitoring');
    }
};
