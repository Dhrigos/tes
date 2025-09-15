<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('telescope_entries', function (Blueprint $table) {
            $table->unsignedBigInteger('sequence');
            $table->char('uuid', 36);
            $table->char('batch_id', 36);
            $table->string('family_hash', 255)->nullable();
            $table->boolean('should_display_on_index')->default(1);
            $table->string('type', 20);
            $table->longText('content');
            $table->dateTime('created_at')->nullable();
            $table->primary('sequence');
            $table->unique(['uuid']);
            $table->index(['batch_id'], 'telescope_entries_batch_id_index');
            $table->index(['family_hash'], 'telescope_entries_family_hash_index');
            $table->index(['created_at'], 'telescope_entries_created_at_index');
            $table->index(['type', 'should_display_on_index'], 'telescope_entries_type_should_display_on_index_index');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('telescope_entries');
    }
};
