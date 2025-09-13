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
            $table->tinyInteger('status_bidan')->default(0)->after('status_dokter');
            $table->timestamp('waktu_panggil_bidan')->nullable()->after('waktu_panggil_dokter');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pelayanan_statuses', function (Blueprint $table) {
            $table->dropColumn(['status_bidan', 'waktu_panggil_bidan']);
        });
    }
};
