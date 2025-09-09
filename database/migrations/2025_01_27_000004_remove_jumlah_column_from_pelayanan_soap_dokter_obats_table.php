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
            $table->dropColumn('jumlah');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pelayanan_soap_dokter_obats', function (Blueprint $table) {
            $table->integer('jumlah')->after('nama_obat');
        });
    }
};
