<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('set_bpjs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('KPFK', 255);
            $table->string('CONSID', 255);
            $table->string('USERNAME', 255);
            $table->string('PASSWORD', 255);
            $table->string('SECRET_KEY', 255);
            $table->string('USER_KEY', 255);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('set_bpjs');
    }
};
