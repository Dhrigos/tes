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
        Schema::table('pelayanan_statuses', function (Blueprint $table) {
            // Tambah kolom waktu_panggil_dokter sebagai timestamp nullable
            if (!Schema::hasColumn('pelayanan_statuses', 'waktu_panggil_dokter')) {
                $table->timestamp('waktu_panggil_dokter')->nullable()->after('updated_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pelayanan_statuses', function (Blueprint $table) {
            if (Schema::hasColumn('pelayanan_statuses', 'waktu_panggil_dokter')) {
                $table->dropColumn('waktu_panggil_dokter');
            }
        });
    }
};


