<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('pelayanan_permintaans_files')) {
            Schema::create('pelayanan_permintaans_files', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('permintaan_id')->index();
                $table->string('original_name');
                $table->string('stored_path');
                $table->string('mime_type')->nullable();
                $table->integer('size_kb')->nullable();
                $table->string('description')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan_permintaans_files');
    }
};
