<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pulse_entries', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('timestamp');
            $table->string('type', 255);
            $table->mediumText('key');
            $table->bigInteger('value')->nullable();
        });
DB::statement("ALTER TABLE `pulse_entries` ADD `key_hash` binary(16) GENERATED ALWAYS AS (unhex(md5(`key`))) VIRTUAL NULL");
        DB::statement("ALTER TABLE `pulse_entries` ADD INDEX `pulse_entries_timestamp_index`(`timestamp`)");
        DB::statement("ALTER TABLE `pulse_entries` ADD INDEX `pulse_entries_type_index`(`type`)");
        DB::statement("ALTER TABLE `pulse_entries` ADD INDEX `pulse_entries_key_hash_index`(`key_hash`)");
        DB::statement("ALTER TABLE `pulse_entries` ADD INDEX `pulse_entries_timestamp_type_key_hash_value_index`(`timestamp`, `type`, `key_hash`, `value`)");
    }

    public function down(): void
    {
        Schema::dropIfExists('pulse_entries');
    }
};
