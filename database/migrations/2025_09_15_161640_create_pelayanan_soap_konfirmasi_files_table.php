<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pelayanan_soap_konfirmasi_files', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('konfirmasi_id');
            $table->string('original_name', 255);
            $table->string('stored_path', 255);
            $table->string('mime_type', 255)->nullable();
            $table->unsignedInteger('size_kb')->nullable();
            $table->text('description')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index(['konfirmasi_id'], 'pelayanan_soap_konfirmasi_files_konfirmasi_id_foreign');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan_soap_konfirmasi_files');
    }
};
