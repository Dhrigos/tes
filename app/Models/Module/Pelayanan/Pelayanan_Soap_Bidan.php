<?php

namespace App\Models\Module\Pelayanan;

use App\Models\Module\Master\Data\Medis\Alergi;
use App\Models\Module\Pelayanan\Gcs\Gcs_Eye;
use App\Models\Module\Pelayanan\Gcs\Gcs_Kesadaran;
use App\Models\Module\Pelayanan\Gcs\Gcs_Motorik;
use App\Models\Module\Pelayanan\Gcs\Gcs_Verbal;
use App\Models\Module\Pemdaftaran\Pendaftaran;
use Illuminate\Database\Eloquent\Model;

class Pelayanan_Soap_Bidan extends Model
{
    protected $table = 'pelayanan_soap_bidans';

    protected $fillable = [
        'nomor_rm',
        'nama',
        'no_rawat',
        'seks',
        'penjamin',
        'tanggal_lahir',
        'umur',
        'tableData',
        'anamnesa',
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
        'htt',
        'assesmen',
        'expertise',
        'evaluasi',
        'plan',
        'odontogram',
        'Decayed',
        'Missing',
        'Filled',
        'Oclusi',
        'Palatinus',
        'Mandibularis',
        'Platum',
        'Diastema',
        'Anomali',
        'files',
        'status_apotek',
    ];

    protected $casts = [
        'tableData' => 'array',
    ];

    // Relasi umum yang juga dipakai di SOAP dokter
    public function alergi_keterangan()
    {
        return $this->belongsTo(Alergi::class, 'alergi', 'kode_alergi');
    }

    public function gcs_eye()
    {
        return $this->belongsTo(Gcs_Eye::class, 'eye', 'skor');
    }

    public function gcs_verbal()
    {
        return $this->belongsTo(Gcs_Verbal::class, 'verbal', 'skor');
    }

    public function gcs_motorik()
    {
        return $this->belongsTo(Gcs_Motorik::class, 'motorik', 'skor');
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
