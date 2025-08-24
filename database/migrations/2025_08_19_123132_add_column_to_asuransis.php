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
        Schema::table('asuransis', function (Blueprint $table) {
            $table->string('jenis_asuransi');
            $table->string('verif_pasien');
            $table->string('filter_obat');
            $table->string('tanggal_mulai');
            $table->string('tanggal_akhir');
            $table->string('alamat_asuransi')->nullable();
            $table->string('no_telp_asuransi')->nullable();
            $table->string('faksimil')->nullable();
            $table->string('pic')->nullable();
            $table->string('no_telp_pic')->nullable();
            $table->string('jabatan_pic')->nullable();
            $table->string('bank')->nullable();
            $table->string('no_rekening')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('asuransis', function (Blueprint $table) {
            $table->dropColumn('jenis_asuransi');
            $table->dropColumn('verif_pasien');
            $table->dropColumn('filter_obat');
            $table->dropColumn('tanggal_mulai');
            $table->dropColumn('tanggal_akhir');
            $table->dropColumn('alamat_asuransi');
            $table->dropColumn('no_telp_asuransi');
            $table->dropColumn('faksimil');
            $table->dropColumn('pic');
            $table->dropColumn('no_telp_pic');
            $table->dropColumn('jabatan_pic');
            $table->dropColumn('bank');
            $table->dropColumn('no_rekening');
        });
    }
};
