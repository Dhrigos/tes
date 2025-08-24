<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\Module\Master\Data\Umum\Agama_Controller;
use App\Http\Controllers\Module\Master\Data\Umum\Asuransi_Controller;
use App\Http\Controllers\Module\Master\Data\Umum\Bahasa_Controller;
use App\Http\Controllers\Module\Master\Data\Umum\Goldar_Controller;
use App\Http\Controllers\Module\Master\Data\Umum\Bangsa_Controller;
use App\Http\Controllers\Module\Master\Data\Umum\Bank_Controller;
use App\Http\Controllers\Module\Master\Data\Umum\Kelamin_Controller;
use App\Http\Controllers\Module\Master\Data\Umum\Loket_Controller;
use App\Http\Controllers\Module\Master\Data\Umum\Pekerjaan_Controller;
use App\Http\Controllers\Module\Master\Data\Umum\Pendidikan_Controller;
use App\Http\Controllers\Module\Master\Data\Umum\Penjamin_Controller;
use App\Http\Controllers\Module\Master\Data\Umum\Pernikahan_Controller;
use App\Http\Controllers\Module\Master\Data\Umum\Suku_Controller;
use App\Http\Controllers\Module\Master\Data\Manajemen\Posker_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Alergi_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Htt_Pemeriksaan_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Htt_Subpemeriksaan_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Laboratorium_Bidang_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Laboratorium_Sub_Bidang_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Sarana_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Spesialis_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Subspesialis_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Icd10_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Icd9_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Jenis_Diet_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Makanan_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Radiologi_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Tindakan_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Instruksi_Obat_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Penggunaan_Obat_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Poli_Controller;
use App\Http\Controllers\Module\Master\Data\Gudang\Daftar_Harga_Jual_Controller;
use App\Http\Controllers\Module\Master\Data\Gudang\Kategori_Inventaris_Controller;
use App\Http\Controllers\Module\Master\Data\Gudang\Kategori_Obat_Controller;
use App\Http\Controllers\Module\Master\Data\Gudang\Satuan_Inventaris_Controller;
use App\Http\Controllers\Module\Master\Data\Gudang\Satuan_Obat_Controller;
use App\Http\Controllers\Module\Master\Data\Gudang\Setting_Harga_Jual_Controller;
use App\Http\Controllers\Module\Master\Data\Gudang\Supplier_Controller;
use App\Http\Controllers\Module\Pendaftaran\Pendaftaran_online_Controller;
use App\Http\Controllers\Module\Pendaftaran\Pendaftaran_Controller;
use App\Http\Controllers\Module\SDM\Dokter_Controller;
use App\Http\Controllers\Module\Pasien\PasienController;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;



// SDM
Route::middleware(['auth'])->prefix('sdm')->as('sdm.')->group(function () {
    Route::get('/dokter', [Dokter_Controller::class, 'index'])->name('dokter.index');
    Route::post('/dokter', [Dokter_Controller::class, 'store'])->name('dokter.store');
    Route::put('/dokter/{dokter}', [Dokter_Controller::class, 'update'])->name('dokter.update');
    Route::delete('/dokter/{dokter}', [Dokter_Controller::class, 'destroy'])->name('dokter.destroy');

    // Proxy pencarian dokter eksternal
    Route::get('/dokter/search', function (Request $request) {
        $nama = (string) $request->query('nama', '');
        $offset = (int) $request->query('offset', 0);
        $limit = (int) $request->query('limit', 10);

        if (strlen(trim($nama)) < 2) {
            return response()->json([
                'response' => ['count' => 0, 'list' => []],
                'metaData' => ['message' => 'OK', 'code' => 200],
            ]);
        }

        $base = rtrim((string) env('EXTERNAL_API_BASE_URL', ''), '/');
        $service = trim((string) env('EXTERNAL_API_SERVICE', 'api'), '/');
        if ($base === '') {
            return response()->json([
                'response' => ['count' => 0, 'list' => []],
                'metaData' => ['message' => 'EXTERNAL_API_BASE_URL not set', 'code' => 500],
            ], 500);
        }

        $url = $base . '/' . $service . '/dokter/' . $offset . '/' . $limit;
        $resp = Http::acceptJson()->get($url, ['nama' => $nama]);
        return response()->json($resp->json(), $resp->status());
    })->name('dokter.search');
});


// Datamaster
Route::middleware(['auth'])->prefix('datamaster')->as('datamaster.')->group(function () {

    // Grup untuk data umum
    Route::prefix('umum')->as('umum.')->group(function () {
        Route::get('/agama', [Agama_Controller::class, 'index'])->name('agama.index');
        Route::post('/agama', [Agama_Controller::class, 'store'])->name('agama.store');
        Route::put('/agama/{agama}', [Agama_Controller::class, 'update'])->name('agama.update');
        Route::delete('/agama/{agama}', [Agama_Controller::class, 'destroy'])->name('agama.destroy');

        Route::get('/golongan-darah', [Goldar_Controller::class, 'index'])->name('golongan-darah.index');
        Route::post('/golongan-darah', [Goldar_Controller::class, 'store'])->name('golongan-darah.store');
        Route::put('/golongan-darah/{goldar}', [Goldar_Controller::class, 'update'])->name('golongan-darah.update');
        Route::delete('/golongan-darah/{goldar}', [Goldar_Controller::class, 'destroy'])->name('golongan-darah.destroy');

        Route::get('/asuransi', [Asuransi_Controller::class, 'index'])->name('asuransi.index');
        Route::post('/asuransi', [Asuransi_Controller::class, 'store'])->name('asuransi.store');
        Route::put('/asuransi/{asuransi}', [Asuransi_Controller::class, 'update'])->name('asuransi.update');
        Route::delete('/asuransi/{asuransi}', [Asuransi_Controller::class, 'destroy'])->name('asuransi.destroy');

        Route::get('/bahasa', [Bahasa_Controller::class, 'index'])->name('bahasa.index');
        Route::post('/bahasa', [Bahasa_Controller::class, 'store'])->name('bahasa.store');
        Route::put('/bahasa/{bahasa}', [Bahasa_Controller::class, 'update'])->name('bahasa.update');
        Route::delete('/bahasa/{bahasa}', [Bahasa_Controller::class, 'destroy'])->name('bahasa.destroy');

        Route::get('/bangsa', [Bangsa_Controller::class, 'index'])->name('bangsa.index');
        Route::post('/bangsa', [Bangsa_Controller::class, 'store'])->name('bangsa.store');
        Route::put('/bangsa/{bangsa}', [Bangsa_Controller::class, 'update'])->name('bangsa.update');
        Route::delete('/bangsa/{bangsa}', [Bangsa_Controller::class, 'destroy'])->name('bangsa.destroy');

        Route::get('/bank', [Bank_Controller::class, 'index'])->name('bank.index');
        Route::post('/bank', [Bank_Controller::class, 'store'])->name('bank.store');
        Route::put('/bank/{bank}', [Bank_Controller::class, 'update'])->name('bank.update');
        Route::delete('/bank/{bank}', [Bank_Controller::class, 'destroy'])->name('bank.destroy');

        Route::get('/kelamin', [Kelamin_Controller::class, 'index'])->name('kelamin.index');
        Route::post('/kelamin', [Kelamin_Controller::class, 'store'])->name('kelamin.store');
        Route::put('/kelamin/{kelamin}', [Kelamin_Controller::class, 'update'])->name('kelamin.update');
        Route::delete('/kelamin/{kelamin}', [Kelamin_Controller::class, 'destroy'])->name('kelamin.destroy');

        Route::get('/loket', [Loket_Controller::class, 'index'])->name('loket.index');
        Route::post('/loket', [Loket_Controller::class, 'store'])->name('loket.store');
        Route::put('/loket/{loket}', [Loket_Controller::class, 'update'])->name('loket.update');
        Route::delete('/loket/{loket}', [Loket_Controller::class, 'destroy'])->name('loket.destroy');

        Route::get('/pekerjaan', [Pekerjaan_Controller::class, 'index'])->name('pekerjaan.index');
        Route::post('/pekerjaan', [Pekerjaan_Controller::class, 'store'])->name('pekerjaan.store');
        Route::put('/pekerjaan/{pekerjaan}', [Pekerjaan_Controller::class, 'update'])->name('pekerjaan.update');
        Route::delete('/pekerjaan/{pekerjaan}', [Pekerjaan_Controller::class, 'destroy'])->name('pekerjaan.destroy');

        Route::get('/pendidikan', [Pendidikan_Controller::class, 'index'])->name('pendidikan.index');
        Route::post('/pendidikan', [Pendidikan_Controller::class, 'store'])->name('pendidikan.store');
        Route::put('/pendidikan/{pendidikan}', [Pendidikan_Controller::class, 'update'])->name('pendidikan.update');
        Route::delete('/pendidikan/{pendidikan}', [Pendidikan_Controller::class, 'destroy'])->name('pendidikan.destroy');

        Route::get('/penjamin', [Penjamin_Controller::class, 'index'])->name('penjamin.index');
        Route::post('/penjamin', [Penjamin_Controller::class, 'store'])->name('penjamin.store');
        Route::put('/penjamin/{penjamin}', [Penjamin_Controller::class, 'update'])->name('penjamin.update');
        Route::delete('/penjamin/{penjamin}', [Penjamin_Controller::class, 'destroy'])->name('penjamin.destroy');


        Route::get('/pernikahan', [Pernikahan_Controller::class, 'index'])->name('pernikahan.index');
        Route::post('/pernikahan', [Pernikahan_Controller::class, 'store'])->name('pernikahan.store');
        Route::put('/pernikahan/{pernikahan}', [Pernikahan_Controller::class, 'update'])->name('pernikahan.update');
        Route::delete('/pernikahan/{pernikahan}', [Pernikahan_Controller::class, 'destroy'])->name('pernikahan.destroy');

        Route::get('/suku', [Suku_Controller::class, 'index'])->name('suku.index');
        Route::post('/suku', [Suku_Controller::class, 'store'])->name('suku.store');
        Route::put('/suku/{suku}', [Suku_Controller::class, 'update'])->name('suku.update');
        Route::delete('/suku/{suku}', [Suku_Controller::class, 'destroy'])->name('suku.destroy');
    });

    // Grup untuk data manajemen
    Route::prefix('manajemen')->as('manajemen.')->group(function () {
        Route::get('/posker', [Posker_Controller::class, 'index'])->name('posker.index');
        Route::post('/posker', [Posker_Controller::class, 'store'])->name('posker.store');
        Route::put('/posker/{posker}', [Posker_Controller::class, 'update'])->name('posker.update');
        Route::delete('/posker/{posker}', [Posker_Controller::class, 'destroy'])->name('posker.destroy');
    });

    // Grup untuk data medis
    Route::prefix('medis')->as('medis.')->group(function () {
        Route::get('/alergi', [Alergi_Controller::class, 'index'])->name('alergi.index');
        Route::post('/alergi', [Alergi_Controller::class, 'store'])->name('alergi.store');
        Route::put('/alergi/{alergi}', [Alergi_Controller::class, 'update'])->name('alergi.update');
        Route::delete('/alergi/{alergi}', [Alergi_Controller::class, 'destroy'])->name('alergi.destroy');
        Route::post('/alergi/{alergi}', [Alergi_Controller::class, 'sync'])->name('alergi.sync');

        Route::get('/htt-pemeriksaan', [Htt_Pemeriksaan_Controller::class, 'index'])->name('htt-pemeriksaan.index');
        Route::post('/htt-pemeriksaan', [Htt_Pemeriksaan_Controller::class, 'store'])->name('htt-pemeriksaan.store');
        Route::put('/htt-pemeriksaan/{httPemeriksaan}', [Htt_Pemeriksaan_Controller::class, 'update'])->name('htt-pemeriksaan.update');
        Route::delete('/htt-pemeriksaan/{httPemeriksaan}', [Htt_Pemeriksaan_Controller::class, 'destroy'])->name('htt-pemeriksaan.destroy');

        Route::get('/htt-subpemeriksaan', [Htt_Subpemeriksaan_Controller::class, 'index'])->name('htt-subpemeriksaan.index');
        Route::post('/htt-subpemeriksaan', [Htt_Subpemeriksaan_Controller::class, 'store'])->name('htt-subpemeriksaan.store');
        Route::put('/htt-subpemeriksaan/{httSubpemeriksaan}', [Htt_Subpemeriksaan_Controller::class, 'update'])->name('htt-subpemeriksaan.update');
        Route::delete('/htt-subpemeriksaan/{httSubpemeriksaan}', [Htt_Subpemeriksaan_Controller::class, 'destroy'])->name('htt-subpemeriksaan.destroy');

        Route::get('/laboratorium-bidang', [Laboratorium_Bidang_Controller::class, 'index'])->name('laboratorium-bidang.index');
        Route::post('/laboratorium-bidang', [Laboratorium_Bidang_Controller::class, 'store'])->name('laboratorium-bidang.store');
        Route::put('/laboratorium-bidang/{laboratoriumBidang}', [Laboratorium_Bidang_Controller::class, 'update'])->name('laboratorium-bidang.update');
        Route::delete('/laboratorium-bidang/{laboratoriumBidang}', [Laboratorium_Bidang_Controller::class, 'destroy'])->name('laboratorium-bidang.destroy');

        Route::get('/laboratorium-sub-bidang', [Laboratorium_Sub_Bidang_Controller::class, 'index'])->name('laboratorium-sub-bidang.index');
        Route::post('/laboratorium-sub-bidang', [Laboratorium_Sub_Bidang_Controller::class, 'store'])->name('laboratorium-sub-bidang.store');
        Route::put('/laboratorium-sub-bidang/{laboratoriumSubBidang}', [Laboratorium_Sub_Bidang_Controller::class, 'update'])->name('laboratorium-sub-bidang.update');
        Route::delete('/laboratorium-sub-bidang/{laboratoriumSubBidang}', [Laboratorium_Sub_Bidang_Controller::class, 'destroy'])->name('laboratorium-sub-bidang.destroy');

        Route::get('/icd9', [Icd9_Controller::class, 'index'])->name('icd9.index');
        Route::post('/icd9', [Icd9_Controller::class, 'store'])->name('icd9.store');
        Route::put('/icd9/{icd9}', [Icd9_Controller::class, 'update'])->name('icd9.update');
        Route::delete('/icd9/{icd9}', [Icd9_Controller::class, 'destroy'])->name('icd9.destroy');
        Route::post('/icd9/sync', [Icd9_Controller::class, 'sync'])->name('icd9.sync');

        Route::get('/icd10', [Icd10_Controller::class, 'index'])->name('icd10.index');
        Route::post('/icd10', [Icd10_Controller::class, 'store'])->name('icd10.store');
        Route::put('/icd10/{icd10}', [Icd10_Controller::class, 'update'])->name('icd10.update');
        Route::delete('/icd10/{icd10}', [Icd10_Controller::class, 'destroy'])->name('icd10.destroy');
        Route::post('/icd10/sync/{kode}', [Icd10_Controller::class, 'sync'])->name('icd10.sync');

        Route::get('/jenis-diet', [Jenis_Diet_Controller::class, 'index'])->name('jenis-diet.index');
        Route::post('/jenis-diet', [Jenis_Diet_Controller::class, 'store'])->name('jenis-diet.store');
        Route::put('/jenis-diet/{jenisDiet}', [Jenis_Diet_Controller::class, 'update'])->name('jenis-diet.update');
        Route::delete('/jenis-diet/{jenisDiet}', [Jenis_Diet_Controller::class, 'destroy'])->name('jenis-diet.destroy');

        Route::get('/makanan', [Makanan_Controller::class, 'index'])->name('makanan.index');
        Route::post('/makanan', [Makanan_Controller::class, 'store'])->name('makanan.store');
        Route::put('/makanan/{makanan}', [Makanan_Controller::class, 'update'])->name('makanan.update');
        Route::delete('/makanan/{makanan}', [Makanan_Controller::class, 'destroy'])->name('makanan.destroy');

        Route::post('/radiologi-jenis', [Radiologi_Controller::class, 'storeJenis'])->name('radiologi-jenis.store');
        Route::put('/radiologi-jenis/{radiologiJenis}', [Radiologi_Controller::class, 'updateJenis'])->name('radiologi-jenis.update');
        Route::delete('/radiologi-jenis/{radiologiJenis}', [Radiologi_Controller::class, 'destroyJenis'])->name('radiologi-jenis.destroy');

        Route::post('/radiologi-pemeriksaan', [Radiologi_Controller::class, 'storePemeriksaan'])->name('radiologi-pemeriksaan.store');
        Route::put('/radiologi-pemeriksaan/{radiologiPemeriksaan}', [Radiologi_Controller::class, 'updatePemeriksaan'])->name('radiologi-pemeriksaan.update');
        Route::delete('/radiologi-pemeriksaan/{radiologiPemeriksaan}', [Radiologi_Controller::class, 'destroyPemeriksaan'])->name('radiologi-pemeriksaan.destroy');

        Route::get('/sarana', [Sarana_Controller::class, 'index'])->name('sarana.index');
        Route::post('/sarana', [Sarana_Controller::class, 'store'])->name('sarana.store');
        Route::put('/sarana/{sarana}', [Sarana_Controller::class, 'update'])->name('sarana.update');
        Route::delete('/sarana/{sarana}', [Sarana_Controller::class, 'destroy'])->name('sarana.destroy');
        Route::post('/sarana/sync', [Sarana_Controller::class, 'sync'])->name('sarana.sync');

        Route::get('/spesialis', [Spesialis_Controller::class, 'index'])->name('spesialis.index');
        Route::post('/spesialis', [Spesialis_Controller::class, 'store'])->name('spesialis.store');
        Route::put('/spesialis/{spesialis}', [Spesialis_Controller::class, 'update'])->name('spesialis.update');
        Route::delete('/spesialis/{spesialis}', [Spesialis_Controller::class, 'destroy'])->name('spesialis.destroy');
        Route::post('/spesialis/sync', [Spesialis_Controller::class, 'sync'])->name('spesialis.sync');

        Route::get('/subspesialis', [Subspesialis_Controller::class, 'index'])->name('subspesialis.index');
        Route::post('/subspesialis', [Subspesialis_Controller::class, 'store'])->name('subspesialis.store');
        Route::put('/subspesialis/{subspesialis}', [Subspesialis_Controller::class, 'update'])->name('subspesialis.update');
        Route::delete('/subspesialis/{subspesialis}', [Subspesialis_Controller::class, 'destroy'])->name('subspesialis.destroy');
        Route::post('/subspesialis/sync/{kode}', [Subspesialis_Controller::class, 'sync'])->name('subspesialis.sync');

        Route::get('/tindakan', [Tindakan_Controller::class, 'index'])->name('tindakan.index');
        Route::post('/tindakan', [Tindakan_Controller::class, 'store'])->name('tindakan.store');
        Route::put('/tindakan/{tindakan}', [Tindakan_Controller::class, 'update'])->name('tindakan.update');
        Route::delete('/tindakan/{tindakan}', [Tindakan_Controller::class, 'destroy'])->name('tindakan.destroy');
        Route::post('/tindakan/sync', [Tindakan_Controller::class, 'sync'])->name('tindakan.sync');

        Route::get('/radiologi', [Radiologi_Controller::class, 'index'])->name('radiologi.index');
        Route::post('/radiologi', [Radiologi_Controller::class, 'store'])->name('radiologi.store');
        Route::put('/radiologi/{radiologi}', [Radiologi_Controller::class, 'update'])->name('radiologi.update');
        Route::delete('/radiologi/{radiologi}', [Radiologi_Controller::class, 'destroy'])->name('radiologi.destroy');
        Route::post('/radiologi/sync', [Radiologi_Controller::class, 'sync'])->name('radiologi.sync');

        Route::get('/instruksi-obat', [Instruksi_Obat_Controller::class, 'index'])->name('instruksi-obat.index');
        Route::post('/instruksi-obat', [Instruksi_Obat_Controller::class, 'store'])->name('instruksi-obat.store');
        Route::put('/instruksi-obat/{instruksiObat}', [Instruksi_Obat_Controller::class, 'update'])->name('instruksi-obat.update');
        Route::delete('/instruksi-obat/{instruksiObat}', [Instruksi_Obat_Controller::class, 'destroy'])->name('instruksi-obat.destroy');

        Route::get('/penggunaan-obat', [Penggunaan_Obat_Controller::class, 'index'])->name('penggunaan-obat.index');
        Route::post('/penggunaan-obat', [Penggunaan_Obat_Controller::class, 'store'])->name('penggunaan-obat.store');
        Route::put('/penggunaan-obat/{id}', [Penggunaan_Obat_Controller::class, 'update'])->name('penggunaan-obat.update');
        Route::delete('/penggunaan-obat/{id}', [Penggunaan_Obat_Controller::class, 'destroy'])->name('penggunaan-obat.destroy');

        Route::get('/poli', [Poli_Controller::class, 'index'])->name('poli.index');
        Route::post('/poli', [Poli_Controller::class, 'store'])->name('poli.store');
        Route::put('/poli/{id}', [Poli_Controller::class, 'update'])->name('poli.update');
        Route::delete('/poli/{id}', [Poli_Controller::class, 'destroy'])->name('poli.destroy');
        Route::post('/poli/sync', [Poli_Controller::class, 'sync'])->name('poli.sync');
    });

    // Grup untuk Gudang
    Route::prefix('gudang')->as('gudang.')->group(function () {
        Route::get('/satuan-obat', [Satuan_Obat_Controller::class, 'index'])->name('satuan-obat.index');
        Route::post('/satuan-obat', [Satuan_Obat_Controller::class, 'store'])->name('satuan-obat.store');
        Route::put('/satuan-obat/{satuanobat}', [Satuan_Obat_Controller::class, 'update'])->name('satuan-obat.update');
        Route::delete('/satuan-obat/{satuanobat}', [Satuan_Obat_Controller::class, 'destroy'])->name('satuan-obat.destroy');

        Route::get('/kategori-obat', [Kategori_Obat_Controller::class, 'index'])->name('kategori-obat.index');
        Route::post('/kategori-obat', [Kategori_Obat_Controller::class, 'store'])->name('kategori-obat.store');
        Route::put('/kategori-obat/{kategoriobat}', [Kategori_Obat_Controller::class, 'update'])->name('kategori-obat.update');
        Route::delete('/kategori-obat/{kategoriobat}', [Kategori_Obat_Controller::class, 'destroy'])->name('kategori-obat.destroy');

        Route::get('/supplier', [Supplier_Controller::class, 'index'])->name('supplier.index');
        Route::post('/supplier', [Supplier_Controller::class, 'store'])->name('supplier.store');
        Route::put('/supplier/{supplier}', [Supplier_Controller::class, 'update'])->name('supplier.update');
        Route::delete('/supplier/{supplier}', [Supplier_Controller::class, 'destroy'])->name('supplier.destroy');

        Route::get('/setting-harga-jual', [Setting_Harga_Jual_Controller::class, 'index'])->name('setting-harga-jual.index');
        Route::post('/setting-harga-jual', [Setting_Harga_Jual_Controller::class, 'store'])->name('setting-harga-jual.store');
        Route::put('/setting-harga-jual/{settingHargaJual}', [Setting_Harga_Jual_Controller::class, 'update'])->name('setting-harga-jual.update');
        Route::delete('/setting-harga-jual/{settingHargaJual}', [Setting_Harga_Jual_Controller::class, 'destroy'])->name('setting-harga-jual.destroy');

        Route::get('/daftar-harga-jual',  [Daftar_Harga_Jual_Controller::class, 'index'])->name('daftar-harga-jual.index');
        Route::post('/daftar-harga-jual', [Daftar_Harga_Jual_Controller::class, 'store'])->name('daftar-harga-jual.store');
        Route::put('/daftar-harga-jual/{daftarHargaJual}', [Daftar_Harga_Jual_Controller::class, 'update'])->name('daftar-harga-jual.update');
        Route::delete('/daftar-harga-jual/{daftarHargaJual}', [Daftar_Harga_Jual_Controller::class, 'destroy'])->name('daftar-harga-jual.destroy');

        Route::get('/satuan-inventaris', [Satuan_Inventaris_Controller::class, 'index'])->name('satuan-inventaris.index');
        Route::post('/satuan-inventaris', [Satuan_Inventaris_Controller::class, 'store'])->name('satuan-inventaris.store');
        Route::put('/satuan-inventaris/{satuanInventaris}', [Satuan_Inventaris_Controller::class, 'update'])->name('satuan-inventaris.update');
        Route::delete('/satuan-inventaris/{satuanInventaris}', [Satuan_Inventaris_Controller::class, 'destroy'])->name('satuan-inventaris.destroy');

        Route::get('/kategori-inventaris', [Kategori_Inventaris_Controller::class, 'index'])->name('kategori-inventaris.index');
        Route::post('/kategori-inventaris', [Kategori_Inventaris_Controller::class, 'store'])->name('kategori-inventaris.store');
        Route::put('/kategori-inventaris/{kategoriInventaris}', [Kategori_Inventaris_Controller::class, 'update'])->name('kategori-inventaris.update');
        Route::delete('/kategori-inventaris/{kategoriInventaris}', [Kategori_Inventaris_Controller::class, 'destroy'])->name('kategori-inventaris.destroy');
    });
});



Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');


Route::middleware(['auth', 'verified'])->prefix('pasien')->as('pasien.')->group(
    function () {
        Route::get('/', [PasienController::class, 'index'])->name('index');
        Route::post('/verifikasi', [PasienController::class, 'verifikasi'])->name('verifikasi');
        Route::post('/update', [PasienController::class, 'update'])->name('update');
        Route::post('/panggil/{id}', [PasienController::class, 'panggil'])->name('panggil');
        Route::get('/kabupaten/{provinceId}', [PasienController::class, 'getKabupaten'])->name('kabupaten');
        Route::get('/kecamatan/{regencyId}', [PasienController::class, 'getKecamatan'])->name('kecamatan');
        Route::get('/desa/{districtId}', [PasienController::class, 'getDesa'])->name('desa');
    }
);

Route::get('/pendaftaran', [Pendaftaran_Controller::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('pendaftaran');

Route::get('/pendaftaran-online', [Pendaftaran_online_Controller::class, 'index'])->name('pendaftaran-online');
Route::post('/pendaftaran-online/add', [Pendaftaran_online_Controller::class, 'add'])->name('pendaftaran-online.add');


Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Module SDM - Dokter
    Route::prefix('module/sdm/dokter')->group(function () {
        Route::get('/', [App\Http\Controllers\Module\SDM\Dokter_Controller::class, 'index'])->name('dokter.index');
        Route::post('/', [App\Http\Controllers\Module\SDM\Dokter_Controller::class, 'store'])->name('dokter.store');
        Route::put('/{id}', [App\Http\Controllers\Module\SDM\Dokter_Controller::class, 'update'])->name('dokter.update');
        Route::delete('/{id}', [App\Http\Controllers\Module\SDM\Dokter_Controller::class, 'destroy'])->name('dokter.destroy');
        Route::post('/verifikasi', [App\Http\Controllers\Module\SDM\Dokter_Controller::class, 'verifikasi'])->name('dokter.verifikasi');

        // Cascading dropdown untuk alamat
        Route::get('/kabupaten/{provinceId}', [App\Http\Controllers\Module\SDM\Dokter_Controller::class, 'getKabupaten']);
        Route::get('/kecamatan/{cityId}', [App\Http\Controllers\Module\SDM\Dokter_Controller::class, 'getKecamatan']);
        Route::get('/desa/{districtId}', [App\Http\Controllers\Module\SDM\Dokter_Controller::class, 'getDesa']);
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
