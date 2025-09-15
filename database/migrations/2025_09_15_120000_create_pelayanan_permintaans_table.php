<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('pelayanan_permintaans')) {
            Schema::create('pelayanan_permintaans', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('nomor_rm')->nullable()->index();
                $table->string('no_rawat')->index(); // nomor_register
                $table->string('jenis_permintaan')->index(); // radiologi, laboratorium, surat_sakit, surat_sehat, surat_kematian, skdp
                $table->string('judul')->nullable();
                $table->text('keterangan')->nullable();
                $table->json('detail_permintaan')->nullable();
                $table->dateTime('tanggal_permintaan')->nullable();
                $table->tinyInteger('status')->default(0); // 0 draft/pending, 1 diajukan, 2 diproses, 3 selesai/cetak
                $table->timestamps();

                $table->index(['no_rawat', 'jenis_permintaan']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan_permintaans');
    }
};
