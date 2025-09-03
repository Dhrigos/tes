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
        Schema::create('broadcast_events', function (Blueprint $table) {
            $table->id();
            $table->string('event_type');
            $table->string('channel_name');
            $table->string('kode_klinik');
            $table->boolean('is_gudang_utama')->default(false);
            $table->json('event_data');
            $table->timestamp('broadcasted_at')->nullable();
            $table->boolean('is_sent')->default(false);
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['event_type', 'kode_klinik']);
            $table->index(['channel_name']);
            $table->index(['broadcasted_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('broadcast_events');
    }
};
