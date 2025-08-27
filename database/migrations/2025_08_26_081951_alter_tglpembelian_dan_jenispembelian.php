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
        Schema::table('pembelians', function (Blueprint $table) {
            $table->renameColumn('user_input_id', 'jenis_pembelian');
            $table->renameColumn('user_input_nama', 'tgl_pembelian');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pembelians', function (Blueprint $table) {
            $table->renameColumn('jenis_pembelian', 'user_input_id');
            $table->renameColumn('tgl_pembelian', 'user_input_nama');
        });
    }
};
