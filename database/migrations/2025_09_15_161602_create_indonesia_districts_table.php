<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('indonesia_districts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->char('code', 7);
            $table->char('city_code', 4);
            $table->string('name', 255);
            $table->text('meta')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique(['code']);
            $table->index(['city_code'], 'indonesia_districts_city_code_foreign');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('indonesia_districts');
    }
};
