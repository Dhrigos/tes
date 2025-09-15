<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key', 255);
            $table->mediumText('value');
            $table->integer('expiration');
            $table->primary('key');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('cache');
    }
};
