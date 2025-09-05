<?php

namespace App\Models\Module\Pelayanan;

use App\Models\Module\Master\Data\Medis\Alergi;
use App\Models\Module\Apotek\Apotek;
use App\Models\Module\Pasien\Pasien;
use App\Models\Module\Pelayanan\Gcs\Gcs_Eye;
use App\Models\Module\Pelayanan\Gcs\Gcs_Kesadaran;
use App\Models\Module\Pelayanan\Gcs\Gcs_Motorik;
use App\Models\Module\Pelayanan\Gcs\Gcs_Verbal;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Icd;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Obat;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Tindakan;
use App\Models\Module\Pemdaftaran\Pendaftaran;
use Illuminate\Database\Eloquent\Model;

class Pelayanan_Soap_Dokter extends Model
{
    protected $table = 'pelayanan_soap_dokters';
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
        'files',
        'status_apotek',
    ];
    protected $casts = [
        'tableData' => 'array', // Mengonversi kolom JSON menjadi array
    ];

    // Model pelayanan_soap_dokter

    public function resep()
    {
        return $this->hasMany(Pelayanan_Soap_Dokter_Obat::class, 'no_rawat', 'no_rawat');
    }

    public function pendaftaran()
    {
        return $this->belongsTo(Pendaftaran::class, 'no_rawat', 'nomor_register');
    }

    public function pasien()
    {
        return $this->belongsTo(Pasien::class, 'nomor_rm', 'no_rm');
    }

    public function apotek()
    {
        return $this->hasOne(Apotek::class, 'no_rawat', 'no_rawat');
    }

    public function icd()
    {
        return $this->hasMany(Pelayanan_Soap_Dokter_Icd::class, 'no_rawat', 'no_rawat');
    }
    public function tindakan()
    {
        return $this->hasOne(Pelayanan_Soap_Dokter_Tindakan::class, 'no_rawat', 'no_rawat');
    }

    public function diet()
    {
        return $this->hasOne(Pelayanan_Soap_Dokter_Diet::class, 'no_rawat', 'no_rawat');
    }

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
}
