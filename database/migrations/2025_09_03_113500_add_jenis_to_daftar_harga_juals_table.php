<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('daftar_harga_juals', function (Blueprint $table) {
            if (!Schema::hasColumn('daftar_harga_juals', 'jenis')) {
                $table->string('jenis')->default('utama')->after('tanggal_obat_masuk');
            }
            // Add a composite index to speed up lookups by kode + jenis (not unique to avoid conflicts)
            $indexes = collect(Schema::getColumnListing('daftar_harga_juals'));
            if ($indexes->contains('kode_obat_alkes')) {
                $table->index(['kode_obat_alkes', 'jenis'], 'idx_kode_jenis');
            }
        });

        // Backfill existing rows to 'utama' if null
        DB::table('daftar_harga_juals')->whereNull('jenis')->update(['jenis' => 'utama']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('daftar_harga_juals', function (Blueprint $table) {
            if (Schema::hasColumn('daftar_harga_juals', 'jenis')) {
                $table->dropColumn('jenis');
            }
        });
    }
};
