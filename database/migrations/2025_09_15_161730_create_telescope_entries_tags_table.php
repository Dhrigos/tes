<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('telescope_entries_tags', function (Blueprint $table) {
            $table->char('entry_uuid', 36);
            $table->string('tag', 255);
            $table->primary(['entry_uuid', 'tag']);
            $table->index(['tag'], 'telescope_entries_tags_tag_index');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('telescope_entries_tags');
    }
};
