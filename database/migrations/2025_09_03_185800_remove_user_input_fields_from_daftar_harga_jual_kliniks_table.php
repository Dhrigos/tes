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
        Schema::table('daftar_harga_jual_kliniks', function (Blueprint $table) {
            $table->dropColumn(['user_input_id', 'user_input_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('daftar_harga_jual_kliniks', function (Blueprint $table) {
            $table->string('user_input_id')->after('tanggal_obat_masuk');
            $table->string('user_input_name')->after('user_input_id');
        });
    }
};
