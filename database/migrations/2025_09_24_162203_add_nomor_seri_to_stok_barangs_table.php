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
        Schema::table('stok_barangs', function (Blueprint $table) {
            if (!Schema::hasColumn('stok_barangs', 'nomor_seri')) {
                $table->string('nomor_seri', 100)->nullable()->index();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stok_barangs', function (Blueprint $table) {
            if (Schema::hasColumn('stok_barangs', 'nomor_seri')) {
                $table->dropColumn('nomor_seri');
            }
        });
    }
};
