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
        Schema::create('setting__harga__juals', function (Blueprint $table) {
            $table->id();
            $table->string('harga_jual_1');
            $table->string('harga_jual_2');
            $table->string('harga_jual_3');
            $table->string('embalase_poin');
            $table->string('user_input_id');
            $table->string('user_input_name');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('setting__harga__juals');
    }
};
