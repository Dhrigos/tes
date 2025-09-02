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
        // Ensure satuan_barang table exists
        if (!Schema::hasTable('satuan_barang')) {
            Schema::create('satuan_barang', function (Blueprint $table) {
                $table->id();
                $table->string('nama');
                $table->timestamps();
            });
        }

        // Ensure kategori_barang table exists
        if (!Schema::hasTable('kategori_barang')) {
            Schema::create('kategori_barang', function (Blueprint $table) {
                $table->id();
                $table->string('nama');
                $table->timestamps();
            });
        }

        // Check if daftar__obats table exists and has all required columns
        if (Schema::hasTable('daftar__obats')) {
            Schema::table('daftar__obats', function (Blueprint $table) {
                // Add missing columns if they don't exist
                if (!Schema::hasColumn('daftar__obats', 'jenis_barang')) {
                    $table->string('jenis_barang')->nullable()->after('nama');
                }
                if (!Schema::hasColumn('daftar__obats', 'deskripsi')) {
                    $table->text('deskripsi')->nullable()->after('nama_dagang');
                }
                if (!Schema::hasColumn('daftar__obats', 'jenis_inventaris')) {
                    $table->string('jenis_inventaris')->nullable()->after('deskripsi');
                }
                if (!Schema::hasColumn('daftar__obats', 'satuan')) {
                    $table->string('satuan')->nullable()->after('jenis_inventaris');
                }
            });
        } else {
            // Create the table if it doesn't exist
            Schema::create('daftar__obats', function (Blueprint $table) {
                $table->id();
                $table->string('kode')->nullable()->unique();
                $table->string('nama');
                $table->string('jenis_barang')->nullable(); // farmasi, alkes, inventaris
                $table->string('nama_dagang')->nullable();
                $table->text('deskripsi')->nullable(); // untuk inventaris
                $table->string('jenis_inventaris')->nullable(); // Elektronik, Non-Elektronik
                $table->string('satuan')->nullable(); // untuk inventaris
                $table->string('jenis_formularium')->nullable();
                $table->string('kfa_kode')->nullable();
                $table->string('nama_industri')->nullable();
                $table->string('merek')->nullable();
                $table->string('satuan_kecil')->nullable();
                $table->integer('nilai_satuan_kecil')->nullable();
                $table->string('satuan_sedang')->nullable();
                $table->integer('nilai_satuan_sedang')->nullable();
                $table->string('satuan_besar')->nullable();
                $table->integer('nilai_satuan_besar')->nullable();
                $table->string('penyimpanan')->nullable();
                $table->string('barcode')->nullable()->index();
                $table->unsignedBigInteger('gudang_kategori')->nullable();
                $table->string('jenis_obat')->nullable(); // Reguler, Khusus, Darurat
                $table->string('jenis_generik')->nullable(); // Non-Generic, Generic Polos, Branded Generic
                $table->string('bentuk_obat')->nullable(); // padat, cair, gas
                $table->timestamps();

                $table->foreign('gudang_kategori')
                    ->references('id')
                    ->on('kategori_barang')
                    ->nullOnDelete()
                    ->cascadeOnUpdate();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop foreign key first
        Schema::table('daftar__obats', function (Blueprint $table) {
            $table->dropForeign(['gudang_kategori']);
        });

        // Drop the table
        Schema::dropIfExists('daftar__obats');
        
        // Drop related tables
        Schema::dropIfExists('satuan_barang');
        Schema::dropIfExists('kategori_barang');
    }
};
