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
        Schema::create('pembelians', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_faktur');
            $table->string('supplier');
            $table->string('no_po_sp');
            $table->string('no_faktur_supplier');
            $table->string('tanggal_terima_barang');
            $table->string('tanggal_faktur');
            $table->string('tanggal_jatuh_tempo');
            $table->string('pajak_ppn');
            $table->string('metode_hna');
            $table->string('sub_total');
            $table->string('total_diskon');
            $table->string('ppn_total');
            $table->string('total');
            $table->string('materai');
            $table->string('koreksi');
            $table->string('penerima_barang');
            $table->string('user_input_id');
            $table->string('user_input_nama');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pembelians');
    }
};
