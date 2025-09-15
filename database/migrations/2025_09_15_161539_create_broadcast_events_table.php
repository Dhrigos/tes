<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('broadcast_events', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('event_type', 255);
            $table->string('channel_name', 255);
            $table->string('kode_klinik', 255);
            $table->boolean('is_gudang_utama')->default(0);
            $table->longText('event_data');
            $table->timestamp('broadcasted_at')->nullable();
            $table->boolean('is_sent')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index(['event_type', 'kode_klinik'], 'broadcast_events_event_type_kode_klinik_index');
            $table->index(['channel_name'], 'broadcast_events_channel_name_index');
            $table->index(['broadcasted_at'], 'broadcast_events_broadcasted_at_index');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('broadcast_events');
    }
};
