<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pelayanan_soap_dokters', function (Blueprint $table) {
            if (!Schema::hasColumn('pelayanan_soap_dokters', 'anamnesa')) {
                $table->text('anamnesa')->nullable()->after('htt');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pelayanan_soap_dokters', function (Blueprint $table) {
            if (Schema::hasColumn('pelayanan_soap_dokters', 'anamnesa')) {
                $table->dropColumn('anamnesa');
            }
        });
    }
};


