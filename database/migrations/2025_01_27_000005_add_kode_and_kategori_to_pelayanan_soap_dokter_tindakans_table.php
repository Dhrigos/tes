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
        Schema::table('pelayanan_soap_dokter_tindakans', function (Blueprint $table) {
            $table->string('kode_tindakan')->nullable()->after('tanggal_lahir');
            $table->string('kategori_tindakan')->nullable()->after('jenis_tindakan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pelayanan_soap_dokter_tindakans', function (Blueprint $table) {
            $table->dropColumn(['kode_tindakan', 'kategori_tindakan']);
        });
    }
};
