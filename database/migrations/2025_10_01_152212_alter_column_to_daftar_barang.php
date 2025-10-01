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
        Schema::table('daftar_barang', function (Blueprint $table) {
            $table->dropColumn('multi_pakai');
            $table->dropColumn('multi_pakai_jumlah');
            $table->dropColumn('multi_pakai_satuan');
            $table->string('bhp')->after('bentuk_obat')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('daftar_barang', function (Blueprint $table) {
            $table->string('multi_pakai')->after('bentuk_obat')->nullable();
            $table->string('multi_pakai_jumlah')->after('bentuk_obat')->nullable();
            $table->string('multi_pakai_satuan')->after('bentuk_obat')->nullable();
            $table->dropColumn('bhp');
        });
    }
};
