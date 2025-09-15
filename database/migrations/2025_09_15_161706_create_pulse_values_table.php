<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pulse_values', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('timestamp');
            $table->string('type', 255);
            $table->mediumText('key');
            $table->mediumText('value');
        });
DB::statement("ALTER TABLE `pulse_values` ADD `key_hash` binary(16) GENERATED ALWAYS AS (unhex(md5(`key`))) VIRTUAL NULL");
        DB::statement("ALTER TABLE `pulse_values` ADD UNIQUE (`type`, `key_hash`)");
        DB::statement("ALTER TABLE `pulse_values` ADD INDEX `pulse_values_timestamp_index`(`timestamp`)");
        DB::statement("ALTER TABLE `pulse_values` ADD INDEX `pulse_values_type_index`(`type`)");
    }

    public function down(): void
    {
        Schema::dropIfExists('pulse_values');
    }
};
