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
        Schema::dropIfExists('harga_jual_utamas');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('harga_jual_utamas', function (Blueprint $table) {
            $table->id();
            $table->string('harga_jual_1');
            $table->string('harga_jual_2');
            $table->string('harga_jual_3');
            $table->string('embalase_poin');
            $table->text('deskripsi')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }
};
