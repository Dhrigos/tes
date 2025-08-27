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
            // Kolom yang dibuat nullable
            $table->string('supplier')->nullable()->change();
            $table->string('no_po_sp')->nullable()->change();
            $table->string('no_faktur_supplier')->nullable()->change();
            $table->string('tanggal_terima_barang')->nullable()->change();
            $table->string('tanggal_faktur')->nullable()->change();
            $table->string('tanggal_jatuh_tempo')->nullable()->change();
            $table->string('pajak_ppn')->nullable()->change();
            $table->string('metode_hna')->nullable()->change();
            $table->string('sub_total')->nullable()->change();
            $table->string('total_diskon')->nullable()->change();
            $table->string('ppn_total')->nullable()->change();
            $table->string('materai')->nullable()->change();
            $table->string('koreksi')->nullable()->change();
            $table->string('jenis_pembelian')->nullable()->change();

            // Kolom yang tetap NOT NULL: nomor_faktur, tgl_pembelian, penerima_barang, total
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pembelians', function (Blueprint $table) {
            // Mengembalikan kolom menjadi NOT NULL
            $table->string('supplier')->nullable(false)->change();
            $table->string('no_po_sp')->nullable(false)->change();
            $table->string('no_faktur_supplier')->nullable(false)->change();
            $table->string('tanggal_terima_barang')->nullable(false)->change();
            $table->string('tanggal_faktur')->nullable(false)->change();
            $table->string('tanggal_jatuh_tempo')->nullable(false)->change();
            $table->string('pajak_ppn')->nullable(false)->change();
            $table->string('metode_hna')->nullable(false)->change();
            $table->string('sub_total')->nullable(false)->change();
            $table->string('total_diskon')->nullable(false)->change();
            $table->string('ppn_total')->nullable(false)->change();
            $table->string('materai')->nullable(false)->change();
            $table->string('koreksi')->nullable(false)->change();
            $table->string('jenis_pembelian')->nullable(false)->change();
        });
    }
};
