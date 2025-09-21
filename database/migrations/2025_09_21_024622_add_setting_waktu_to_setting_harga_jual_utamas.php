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
        Schema::table('setting_harga_jual_utamas', function (Blueprint $table) {
            $table->string('setting_waktu')->nullable()->after('harga_jual_3');
            $table->string('satuan_waktu')->nullable()->after('setting_waktu');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('setting_harga_jual_utamas', function (Blueprint $table) {
            $table->dropColumn('setting_waktu');
            $table->dropColumn('satuan_waktu');
        });
    }
};
