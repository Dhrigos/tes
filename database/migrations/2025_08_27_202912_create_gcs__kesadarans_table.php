<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('gcs_kesadarans', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('skor');
            $table->string('kode');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gcs_kesadarans');
    }
};
