<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('odontogram_details', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nomor_rm', 255);
            $table->string('nama', 255);
            $table->string('no_rawat', 255);
            $table->string('sex', 255);
            $table->string('penjamin', 255);
            $table->date('tanggal_lahir');
            $table->string('Decayed', 255)->nullable();
            $table->string('Missing', 255)->nullable();
            $table->string('Filled', 255)->nullable();
            $table->string('Oclusi', 255)->nullable();
            $table->string('Palatinus', 255)->nullable();
            $table->string('Mandibularis', 255)->nullable();
            $table->string('Platum', 255)->nullable();
            $table->string('Diastema', 255)->nullable();
            $table->string('Anomali', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('odontogram_details');
    }
};
