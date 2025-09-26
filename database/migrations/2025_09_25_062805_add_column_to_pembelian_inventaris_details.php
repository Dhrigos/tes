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
        Schema::table('pembelian_inventaris_details', function (Blueprint $table) {
            $table->string('batch')->after('kondisi')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pembelian_inventaris_details', function (Blueprint $table) {
            $table->dropColumn('batch');
        });
    }
};
