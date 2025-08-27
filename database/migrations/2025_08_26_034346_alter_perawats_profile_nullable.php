<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Jadikan kolom profile pada tabel perawats menjadi NULLABLE tanpa membutuhkan doctrine/dbal
        DB::statement('ALTER TABLE perawats MODIFY profile VARCHAR(255) NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Kembalikan menjadi NOT NULL dengan default string kosong agar tidak gagal pada rollback
        DB::statement("ALTER TABLE perawats MODIFY profile VARCHAR(255) NOT NULL DEFAULT ''");
    }
};
