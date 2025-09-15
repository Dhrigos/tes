<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('radiologi_pemeriksaans', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nama', 255);
            $table->unsignedBigInteger('id_jenis');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index(['id_jenis'], 'radiologi_pemeriksaans_id_jenis_foreign');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('radiologi_pemeriksaans');
    }
};
