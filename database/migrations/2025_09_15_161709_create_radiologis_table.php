<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('radiologis', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('jenis', 255);
            $table->string('pemeriksaan', 255);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('radiologis');
    }
};
