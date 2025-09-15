<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subspesialis', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nama', 255);
            $table->string('kode', 255);
            $table->string('kode_rujukan', 255);
            $table->unsignedBigInteger('id_spesialis');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index(['id_spesialis'], 'subspesialis_id_spesialis_foreign');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('subspesialis');
    }
};
