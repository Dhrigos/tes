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
        Schema::create('apoteks', function (Blueprint $table) {
            $table->id();
            $table->string('kode_faktur');
            $table->string('no_rm');
            $table->string('no_rawat')->nullable();
            $table->string('nama');
            $table->string('alamat')->nullable();
            $table->string('tanggal');
            $table->string('jenis_resep');
            $table->string('jenis_rawat');
            $table->string('poli')->nullable();
            $table->string('dokter')->nullable();
            $table->string('penjamin');
            $table->string('embalase_poin');
            $table->string('sub_total');
            $table->string('embis_total');
            $table->string('total');
            $table->string('note_apotek')->nullable();
            $table->string('status_kasir');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('apoteks');
    }
};
