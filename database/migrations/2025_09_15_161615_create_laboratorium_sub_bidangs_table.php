<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('laboratorium_sub_bidangs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nama', 255);
            $table->unsignedBigInteger('id_laboratorium_bidang');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index(['id_laboratorium_bidang'], 'laboratorium_sub_bidangs_id_laboratorium_bidang_foreign');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('laboratorium_sub_bidangs');
    }
};
