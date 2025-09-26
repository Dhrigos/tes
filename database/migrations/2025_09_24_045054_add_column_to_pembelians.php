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
        Schema::table('pembelians', function (Blueprint $table) {
            $table->string('kategori_pembelian')->after('nomor_faktur')->nullable();
            $table->string('no_surat_jalan')->after('no_faktur_supplier')->nullable();
            $table->string('diskon_header')->after('pajak_ppn')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pembelians', function (Blueprint $table) {
            $table->dropColumn('kategori_pembelian');
            $table->dropColumn('no_surat_jalan');
            $table->dropColumn('diskon_header');
        });
    }
};
