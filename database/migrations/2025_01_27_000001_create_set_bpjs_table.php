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
        Schema::create('set_bpjs', function (Blueprint $table) {
            $table->id();
            $table->string('KPFK');
            $table->string('CONSID');
            $table->string('USERNAME');
            $table->string('PASSWORD');
            $table->string('SECRET_KEY');
            $table->string('USER_KEY');
            $table->string('APP_CODE');
            $table->string('BASE_URL');
            $table->string('SERVICE');
            $table->string('SERVICE_ANTREAN');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('set_bpjs');
    }
};
