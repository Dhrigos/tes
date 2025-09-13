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
        Schema::table('pelayanan_soap_dokter_obats', function (Blueprint $table) {
            // Tambahkan kolom baru sesuai input pemeriksaan.tsx
            $table->string('jumlah_diberikan')->nullable()->after('nama_obat');
            $table->string('satuan_signa')->nullable()->after('satuan_gudang');
            $table->string('dtd')->nullable()->after('penggunaan');
            $table->string('dtd_mode')->nullable()->after('dtd');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pelayanan_soap_dokter_obats', function (Blueprint $table) {
            $table->dropColumn([
                'jumlah_diberikan',
                'satuan_signa',
                'dtd',
                'dtd_mode'
            ]);
        });
    }
};
