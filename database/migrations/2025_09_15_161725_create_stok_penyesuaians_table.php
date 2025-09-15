<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stok_penyesuaians', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('kode_obat', 255);
            $table->string('nama_obat', 255);
            $table->string('qty_sebelum', 255);
            $table->string('qty_mutasi', 255);
            $table->string('qty_sesudah', 255);
            $table->string('jenis_penyesuaian', 255);
            $table->string('jenis_gudang', 255)->nullable();
            $table->string('alasan', 255);
            $table->string('user_input_name', 255);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('stok_penyesuaians');
    }
};
