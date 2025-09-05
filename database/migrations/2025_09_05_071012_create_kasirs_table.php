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
        Schema::create('kasirs', function (Blueprint $table) {
            $table->id();
            $table->string('kode_faktur');
            $table->string('no_rawat')->nullable();
            $table->string('no_rm');
            $table->string('nama');
            $table->string('sex')->nullable();
            $table->string('usia')->nullable();
            $table->string('alamat')->nullable();
            $table->string('poli');
            $table->string('dokter')->nullable();
            $table->string('jenis_perawatan');
            $table->string('penjamin');
            $table->string('tanggal');
            $table->string('sub_total');
            $table->string('potongan_harga');
            $table->string('administrasi');
            $table->string('materai');
            $table->string('total');
            $table->string('tagihan');
            $table->string('kembalian');
            $table->string('payment_method_1')->nullable();
            $table->string('payment_nominal_1')->nullable();
            $table->string('payment_type_1')->nullable();
            $table->string('payment_ref_1')->nullable();
            $table->string('payment_method_2')->nullable();
            $table->string('payment_nominal_2')->nullable();
            $table->string('payment_type_2')->nullable();
            $table->string('payment_ref_2')->nullable();
            $table->string('payment_method_3')->nullable();
            $table->string('payment_nominal_3')->nullable();
            $table->string('payment_type_3')->nullable();
            $table->string('payment_ref_3')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kasirs');
    }
};
