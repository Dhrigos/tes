<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pembelians', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nomor_faktur', 255);
            $table->string('supplier', 255)->nullable();
            $table->string('no_po_sp', 255)->nullable();
            $table->string('no_faktur_supplier', 255)->nullable();
            $table->string('tanggal_terima_barang', 255)->nullable();
            $table->string('tanggal_faktur', 255)->nullable();
            $table->string('tanggal_jatuh_tempo', 255)->nullable();
            $table->string('pajak_ppn', 255)->nullable();
            $table->string('metode_hna', 255)->nullable();
            $table->string('sub_total', 255)->nullable();
            $table->string('total_diskon', 255)->nullable();
            $table->string('ppn_total', 255)->nullable();
            $table->string('total', 255);
            $table->string('materai', 255)->nullable();
            $table->string('koreksi', 255)->nullable();
            $table->string('penerima_barang', 255);
            $table->string('jenis_pembelian', 255)->nullable();
            $table->string('tgl_pembelian', 255);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('pembelians');
    }
};
