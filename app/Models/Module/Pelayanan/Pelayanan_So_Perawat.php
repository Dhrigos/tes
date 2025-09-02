<?php

namespace App\Models\Module\Pelayanan;

use App\Models\Module\Master\Data\Medis\Alergi;
use App\Models\Module\Pelayanan\Gcs\Gcs_Eye;
use App\Models\Module\Pelayanan\Gcs\Gcs_Kesadaran;
use App\Models\Module\Pelayanan\Gcs\Gcs_Motorik;
use App\Models\Module\Pelayanan\Gcs\Gcs_Verbal;
use App\Models\Module\Pemdaftaran\Pendaftaran;
use Illuminate\Database\Eloquent\Model;

class Pelayanan_So_Perawat extends Model
{
    protected $table = 'pelayanan_so_perawats';
    
    protected $fillable = [
        'nomor_rm',
        'nama',
        'no_rawat',
        'seks',
        'penjamin',
        'tanggal_lahir',
        'umur',
        'tableData',
        'sistol',
        'distol',
        'tensi',
        'suhu',
        'nadi',
        'rr',
        'tinggi',
        'berat',
        'spo2',
        'lingkar_perut',
        'nilai_bmi',
        'status_bmi',
        'jenis_alergi',
        'alergi',
        'eye',
        'verbal',
        'motorik',
        'summernote',
        'files',
        'user_input_id',
        'user_input_name',
    ];

    protected $casts = [
        'tableData' => 'array', // Mengonversi kolom JSON menjadi array
    ];

    // pelayanan_soap_perawat.php

    public function alergi_keterangan()
    {
        return $this->belongsTo(Alergi::class, 'alergi', 'kode_alergi');
    }

    public function gcs_eye()
    {
        return $this->belongsTo(Gcs_Eye::class, 'eye');
    }

    public function gcs_verbal()
    {
        return $this->belongsTo(Gcs_Verbal::class, 'verbal');
    }

    public function gcs_motorik()
    {
        return $this->belongsTo(Gcs_Motorik::class, 'motorik');
    }

    public function gcs_kesadaran()
    {
        return $this->belongsTo(Gcs_Kesadaran::class, 'gcs_total', 'skor');
    }

    public function pendaftaran()
    {
        return $this->belongsTo(Pendaftaran::class, 'no_rawat', 'nomor_register');
    }
}
