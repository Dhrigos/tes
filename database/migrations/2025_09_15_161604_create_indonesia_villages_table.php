<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('indonesia_villages', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->char('code', 10);
            $table->char('district_code', 7);
            $table->string('name', 255);
            $table->text('meta')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique(['code']);
            $table->index(['district_code'], 'indonesia_villages_district_code_foreign');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('indonesia_villages');
    }
};
