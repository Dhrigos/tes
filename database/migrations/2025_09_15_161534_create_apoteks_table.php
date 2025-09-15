<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('apoteks', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('kode_faktur', 255);
            $table->string('no_rm', 255);
            $table->string('no_rawat', 255)->nullable();
            $table->string('nama', 255);
            $table->string('alamat', 255)->nullable();
            $table->string('tanggal', 255);
            $table->string('jenis_resep', 255);
            $table->string('jenis_rawat', 255);
            $table->string('poli', 255)->nullable();
            $table->string('dokter', 255)->nullable();
            $table->string('penjamin', 255);
            $table->string('embalase_poin', 255);
            $table->string('sub_total', 255);
            $table->string('embis_total', 255);
            $table->string('total', 255);
            $table->string('note_apotek', 255)->nullable();
            $table->string('status_kasir', 255);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('apoteks');
    }
};
