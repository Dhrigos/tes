<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asuransis', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nama', 255);
            $table->string('kode', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->string('jenis_asuransi', 255);
            $table->string('verif_pasien', 255);
            $table->string('filter_obat', 255);
            $table->string('tanggal_mulai', 255);
            $table->string('tanggal_akhir', 255);
            $table->string('alamat_asuransi', 255)->nullable();
            $table->string('no_telp_asuransi', 255)->nullable();
            $table->string('faksimil', 255)->nullable();
            $table->string('pic', 255)->nullable();
            $table->string('no_telp_pic', 255)->nullable();
            $table->string('jabatan_pic', 255)->nullable();
            $table->string('bank', 255)->nullable();
            $table->unsignedBigInteger('bank_id')->nullable();
            $table->string('no_rekening', 255)->nullable();
            $table->unique(['nama']);
            $table->index(['bank_id'], 'asuransis_bank_id_foreign');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('asuransis');
    }
};
