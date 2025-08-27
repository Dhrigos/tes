<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('daftar__obats', function (Blueprint $table) {
            if (!Schema::hasColumn('daftar__obats', 'nama_dagang')) {
                $table->string('nama_dagang')->nullable()->after('nama');
            }
            if (!Schema::hasColumn('daftar__obats', 'merek')) {
                $table->string('merek')->nullable()->after('nama_industri');
            }
        });
    }

    public function down(): void
    {
        Schema::table('daftar__obats', function (Blueprint $table) {
            if (Schema::hasColumn('daftar__obats', 'nama_dagang')) {
                $table->dropColumn('nama_dagang');
            }
            if (Schema::hasColumn('daftar__obats', 'merek')) {
                $table->dropColumn('merek');
            }
        });
    }
};


