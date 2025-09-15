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
        Schema::create('rujukans', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->string('nomor_rm')->index();
            $table->string('nomor_register')->index();
            $table->string('penjamin')->nullable();

            $table->string('jenis_rujukan');
            $table->string('tujuan_rujukan');
            $table->string('opsi_rujukan');

            // Spesialis
            $table->string('sarana')->nullable();
            $table->string('kategori_rujukan')->nullable();
            $table->string('alasanTacc')->nullable();
            $table->string('spesialis')->nullable();
            $table->string('sub_spesialis')->nullable();
            $table->date('tanggal_rujukan')->nullable();
            $table->string('tujuan_rujukan_spesialis')->nullable();

            // Rujukan Khusus
            $table->string('igd_rujukan_khusus')->nullable();
            $table->string('subspesialis_khusus')->nullable();
            $table->date('tanggal_rujukan_khusus')->nullable();
            $table->string('tujuan_rujukan_khusus')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rujukans');
    }
};
