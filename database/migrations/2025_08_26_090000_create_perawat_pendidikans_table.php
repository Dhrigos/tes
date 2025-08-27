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
        Schema::create('perawat_pendidikans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('perawat_id')->constrained('perawats')->onDelete('cascade');
            $table->string('jenjang');
            $table->string('institusi')->nullable();
            $table->string('tahun_lulus', 10)->nullable();
            $table->string('nomor_ijazah')->nullable();
            $table->string('file_ijazah')->nullable();
            $table->timestamps();

            $table->index(['perawat_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('perawat_pendidikans');
    }
};
