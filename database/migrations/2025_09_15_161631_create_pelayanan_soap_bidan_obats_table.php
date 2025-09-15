<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pelayanan_soap_bidan_obats', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nomor_rm', 255);
            $table->string('nama', 255);
            $table->string('no_rawat', 255);
            $table->string('seks', 255)->nullable();
            $table->string('penjamin', 255)->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->string('penanda', 255)->nullable();
            $table->string('nama_obat', 255);
            $table->string('instruksi', 255)->nullable();
            $table->string('signa', 255)->nullable();
            $table->string('satuan_gudang', 255)->nullable();
            $table->string('penggunaan', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan_soap_bidan_obats');
    }
};
