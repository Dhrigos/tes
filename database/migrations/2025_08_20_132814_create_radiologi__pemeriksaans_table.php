<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('radiologi_pemeriksaans', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->unsignedBigInteger('id_jenis');
            $table->timestamps();
            
            $table->foreign('id_jenis')->references('id')->on('radiologi_jenis')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('radiologi_pemeriksaans');
    }
};
