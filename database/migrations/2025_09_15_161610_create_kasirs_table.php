<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kasirs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('kode_faktur', 255);
            $table->string('no_rawat', 255)->nullable();
            $table->string('no_rm', 255);
            $table->string('nama', 255);
            $table->string('sex', 255)->nullable();
            $table->string('usia', 255)->nullable();
            $table->string('alamat', 255)->nullable();
            $table->string('poli', 255);
            $table->string('dokter', 255)->nullable();
            $table->string('jenis_perawatan', 255);
            $table->string('penjamin', 255);
            $table->string('tanggal', 255);
            $table->string('sub_total', 255);
            $table->string('potongan_harga', 255);
            $table->string('administrasi', 255);
            $table->string('materai', 255);
            $table->string('total', 255);
            $table->string('tagihan', 255);
            $table->string('kembalian', 255);
            $table->string('payment_method_1', 255)->nullable();
            $table->string('payment_nominal_1', 255)->nullable();
            $table->string('payment_type_1', 255)->nullable();
            $table->string('payment_ref_1', 255)->nullable();
            $table->string('payment_method_2', 255)->nullable();
            $table->string('payment_nominal_2', 255)->nullable();
            $table->string('payment_type_2', 255)->nullable();
            $table->string('payment_ref_2', 255)->nullable();
            $table->string('payment_method_3', 255)->nullable();
            $table->string('payment_nominal_3', 255)->nullable();
            $table->string('payment_type_3', 255)->nullable();
            $table->string('payment_ref_3', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('kasirs');
    }
};
