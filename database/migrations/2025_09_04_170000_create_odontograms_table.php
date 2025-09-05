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
        Schema::create('odontograms', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_rm');
            $table->string('nama');
            $table->string('no_rawat');
            $table->string('sex');
            $table->string('penjamin');
            $table->date('tanggal_lahir');
            $table->string('tooth_number', 10); // Nomor gigi (misal "11", "24", dsb)
            $table->string('condition', 50); // Misal "sehat", "karies", "tambal"
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('odontograms');
    }
};
