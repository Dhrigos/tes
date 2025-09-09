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
        if (!Schema::hasTable('posker_role')) {
            Schema::create('posker_role', function (Blueprint $table) {
                $table->unsignedBigInteger('posker_id');
                $table->unsignedBigInteger('role_id');

                $table->foreign('posker_id')->references('id')->on('poskers')->onDelete('cascade');
                $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
                $table->primary(['posker_id', 'role_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('posker_role')) {
            Schema::drop('posker_role');
        }
    }
};
