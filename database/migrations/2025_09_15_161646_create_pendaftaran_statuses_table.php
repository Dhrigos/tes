<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pendaftaran_statuses', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nomor_rm', 255);
            $table->string('pasien_id', 255);
            $table->string('nomor_register', 255);
            $table->string('register_id', 255);
            $table->string('tanggal_kujungan', 255);
            $table->string('status_panggil', 255);
            $table->string('status_pendaftaran', 255);
            $table->string('Status_aplikasi', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('pendaftaran_statuses');
    }
};
