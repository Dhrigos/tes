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
        Schema::create('pengeluaran_barang', function (Blueprint $table) {
            $table->id();
            $table->string('kode_barang_keluar')->index();
            $table->string('jenis_pengeluaran');
            $table->string('supplier_id')->nullable();
            $table->date('tanggal_return');
            $table->string('nama_pemeriksa');
            $table->string('nama_approver');
            $table->text('keterangan')->nullable();            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengeluaran_barang');
    }
};
