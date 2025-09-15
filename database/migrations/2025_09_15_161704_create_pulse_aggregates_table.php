<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pulse_aggregates', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('bucket');
            $table->mediumInteger('period');
            $table->string('type', 255);
            $table->mediumText('key');
            $table->string('aggregate', 255);
            $table->decimal('value', 20, 2);
            $table->unsignedInteger('count')->nullable();
        });
DB::statement("ALTER TABLE `pulse_aggregates` ADD `key_hash` binary(16) GENERATED ALWAYS AS (unhex(md5(`key`))) VIRTUAL NULL");
        DB::statement("ALTER TABLE `pulse_aggregates` ADD UNIQUE (`bucket`, `period`, `type`, `aggregate`, `key_hash`)");
        DB::statement("ALTER TABLE `pulse_aggregates` ADD INDEX `pulse_aggregates_period_bucket_index`(`period`, `bucket`)");
        DB::statement("ALTER TABLE `pulse_aggregates` ADD INDEX `pulse_aggregates_type_index`(`type`)");
        DB::statement("ALTER TABLE `pulse_aggregates` ADD INDEX `pulse_aggregates_period_type_aggregate_bucket_index`(`period`, `type`, `aggregate`, `bucket`)");
    }

    public function down(): void
    {
        Schema::dropIfExists('pulse_aggregates');
    }
};
