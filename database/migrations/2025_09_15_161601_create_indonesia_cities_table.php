<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('indonesia_cities', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->char('code', 4);
            $table->char('province_code', 2);
            $table->string('name', 255);
            $table->text('meta')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique(['code']);
            $table->index(['province_code'], 'indonesia_cities_province_code_foreign');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('indonesia_cities');
    }
};
