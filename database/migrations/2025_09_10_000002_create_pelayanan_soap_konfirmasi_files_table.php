<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pelayanan_soap_konfirmasi_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('konfirmasi_id')->constrained('pelayanan_soap_konfirmasi')->onDelete('cascade');
            $table->string('original_name');
            $table->string('stored_path');
            $table->string('mime_type')->nullable();
            $table->unsignedInteger('size_kb')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pelayanan_soap_konfirmasi_files');
    }
};


