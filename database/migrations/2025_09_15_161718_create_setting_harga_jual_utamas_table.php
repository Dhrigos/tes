<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('setting_harga_jual_utamas', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('harga_jual_1', 255);
            $table->string('harga_jual_2', 255);
            $table->string('harga_jual_3', 255);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('setting_harga_jual_utamas');
    }
};
