<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('perawats', function (Blueprint $table) {
            $table->unsignedBigInteger('users')->nullable();
            $table->foreign('users')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('perawats', function (Blueprint $table) {
            $table->dropForeign(['users']);
            $table->dropColumn('users');
        });
    }
};
