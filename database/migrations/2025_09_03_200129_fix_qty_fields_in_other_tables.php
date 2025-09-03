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
        // Fix permintaan_barang_konfirmasi table
        Schema::table('permintaan_barang_konfirmasi', function (Blueprint $table) {
            $table->integer('qty')->change();
        });

        // Fix data_barang_keluar table
        Schema::table('data_barang_keluar', function (Blueprint $table) {
            $table->integer('qty')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert permintaan_barang_konfirmasi table
        Schema::table('permintaan_barang_konfirmasi', function (Blueprint $table) {
            $table->string('qty')->change();
        });

        // Revert data_barang_keluar table
        Schema::table('data_barang_keluar', function (Blueprint $table) {
            $table->string('qty')->change();
        });
    }
};
