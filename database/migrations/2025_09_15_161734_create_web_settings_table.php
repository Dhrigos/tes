<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('web_settings', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('nama', 255)->nullable();
            $table->text('alamat')->nullable();
            $table->string('profile_image', 255)->nullable();
            $table->string('kode_klinik', 255)->nullable();
            $table->boolean('is_bpjs_active')->default(1);
            $table->boolean('is_satusehat_active')->default(1);
            $table->boolean('is_gudangutama_active')->default(1);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->string('kode_group_klinik', 255)->nullable();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('web_settings');
    }
};
