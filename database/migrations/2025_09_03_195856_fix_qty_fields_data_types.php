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
        // Fix stok_inventaris table
        Schema::table('stok_inventaris', function (Blueprint $table) {
            $table->integer('qty_barang')->change();
        });

        // Fix stok_barangs table
        Schema::table('stok_barangs', function (Blueprint $table) {
            $table->integer('qty')->change();
        });

        // Fix stok_inventaris_klinik table
        Schema::table('stok_inventaris_klinik', function (Blueprint $table) {
            $table->integer('qty_barang')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert stok_inventaris table
        Schema::table('stok_inventaris', function (Blueprint $table) {
            $table->string('qty_barang')->change();
        });

        // Revert stok_barangs table
        Schema::table('stok_barangs', function (Blueprint $table) {
            $table->string('qty')->change();
        });

        // Revert stok_inventaris_klinik table
        Schema::table('stok_inventaris_klinik', function (Blueprint $table) {
            $table->string('qty_barang')->change();
        });
    }
};
