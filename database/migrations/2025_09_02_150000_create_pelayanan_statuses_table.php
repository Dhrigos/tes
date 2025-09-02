<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pelayanan_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_register');
            $table->unsignedBigInteger('pasien_id')->nullable();
            $table->timestamp('tanggal_kujungan')->nullable();
            // 0 = belum dipanggil, 1 = dipanggil/di ruang, 2 = selesai tahap
            $table->tinyInteger('status_perawat')->default(0);
            $table->tinyInteger('status_dokter')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan_statuses');
    }
};


