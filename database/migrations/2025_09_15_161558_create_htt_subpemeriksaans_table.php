<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('htt_subpemeriksaans', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nama', 255);
            $table->unsignedBigInteger('id_htt_pemeriksaan');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index(['id_htt_pemeriksaan'], 'htt_subpemeriksaans_id_htt_pemeriksaan_foreign');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('htt_subpemeriksaans');
    }
};
