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
        Schema::create('permintaan_cetak', function (Blueprint $table) {
            $table->id();
            $table->string('no_rawat')->index();
            $table->string('nomor_rm')->nullable();
            $table->string('jenis_permintaan'); // radiologi, laboratorium, surat_sakit, surat_sehat, surat_kematian, skdp
            $table->json('detail_permintaan')->nullable(); // data detail untuk cetak
            $table->string('judul')->nullable();
            $table->text('keterangan')->nullable();
            $table->string('status')->default('draft'); // draft, printed, cancelled
            $table->timestamp('tanggal_cetak')->nullable();
            $table->string('created_by')->nullable(); // user yang membuat
            $table->string('printed_by')->nullable(); // user yang mencetak
            $table->timestamps();
            
            $table->index(['no_rawat', 'jenis_permintaan']);
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permintaan_cetak');
    }
};
