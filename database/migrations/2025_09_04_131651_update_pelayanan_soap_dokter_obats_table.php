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
        Schema::table('pelayanan_soap_dokter_obats', function (Blueprint $table) {
            // Drop the existing column
            $table->dropColumn('resep_obat');
            
            // Add new columns
            $table->string('penanda')->after('penjamin');
            $table->string('nama_obat')->after('penanda');
            $table->integer('jumlah')->after('nama_obat');
            $table->string('instruksi')->after('jumlah');
            $table->string('signa')->after('instruksi');
            $table->string('satuan_gudang')->after('signa');
            $table->string('penggunaan')->after('satuan_gudang');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pelayanan_soap_dokter_obats', function (Blueprint $table) {
            // Drop the new columns
            $table->dropColumn([
                'penanda',
                'nama_obat',
                'jumlah',
                'instruksi',
                'signa',
                'satuan_gudang',
                'penggunaan'
            ]);
            
            // Re-add the old column
            $table->text('resep_obat')->nullable();
        });
    }
};
