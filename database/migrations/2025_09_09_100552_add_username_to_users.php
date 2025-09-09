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
        Schema::table('users', function (Blueprint $table) {
            // Tambah kolom nullable dulu untuk hindari konflik data eksisting
            $table->string('username')->nullable()->after('name');
        });

        // Backfill username unik untuk semua baris yang belum punya username
        DB::statement("UPDATE users SET username = CONCAT('user', id) WHERE username IS NULL OR username = ''");

        // Tambahkan unique index setelah data aman
        Schema::table('users', function (Blueprint $table) {
            $table->unique('username');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Hapus index dan kolom jika ada
            $table->dropUnique('users_username_unique');
            $table->dropColumn('username');
        });
    }
};
