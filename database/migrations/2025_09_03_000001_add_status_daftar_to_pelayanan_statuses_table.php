<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pelayanan_statuses', function (Blueprint $table) {
            if (!Schema::hasColumn('pelayanan_statuses', 'status_daftar')) {
                $table->tinyInteger('status_daftar')->default(0)->after('tanggal_kujungan');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pelayanan_statuses', function (Blueprint $table) {
            if (Schema::hasColumn('pelayanan_statuses', 'status_daftar')) {
                $table->dropColumn('status_daftar');
            }
        });
    }
};


