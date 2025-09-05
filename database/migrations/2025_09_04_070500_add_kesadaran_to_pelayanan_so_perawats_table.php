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
        Schema::table('pelayanan_so_perawats', function (Blueprint $table) {
            if (!Schema::hasColumn('pelayanan_so_perawats', 'kesadaran')) {
                $table->string('kesadaran')->nullable()->after('motorik');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pelayanan_so_perawats', function (Blueprint $table) {
            if (Schema::hasColumn('pelayanan_so_perawats', 'kesadaran')) {
                $table->dropColumn('kesadaran');
            }
        });
    }
};


