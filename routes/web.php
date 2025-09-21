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
use App\Http\Controllers\Module\Master\Data\Medis\Instruksi_Obat_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Penggunaan_Obat_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Poli_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Kategori_Tindakan_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Tindakan_Controller;
use App\Http\Controllers\Module\Master\Data\Gudang\Daftar_Harga_Jual_Controller;
use App\Http\Controllers\Module\Master\Data\Gudang\Daftar_Harga_Jual_Klinik_Controller;
use App\Http\Controllers\Module\Master\Data\Gudang\Daftar_Barang_Controller;
// use App\Http\Controllers\Module\Master\Data\Gudang\Kategori_Inventaris_Controller;
// use App\Http\Controllers\Module\Master\Data\Gudang\Kategori_Obat_Controller;
use App\Http\Controllers\Module\Master\Data\Gudang\Kategori_Barang_Controller;
use App\Http\Controllers\Module\Master\Data\Gudang\Satuan_Barang_Controller;
use App\Http\Controllers\Module\Master\Data\Gudang\Harga_Jual_Utama_Controller;
use App\Http\Controllers\Module\Master\Data\Gudang\Setting_Harga_Jual_Controller;
use App\Http\Controllers\Module\Master\Data\Gudang\Setting_Harga_Jual_Utama_Controller;
use App\Http\Controllers\Module\Master\Data\Gudang\Supplier_Controller;
use App\Http\Controllers\Module\Pendaftaran\Pendaftaran_online_Controller;
use App\Http\Controllers\Module\Pendaftaran\Pendaftaran_Controller;
use App\Http\Controllers\Module\SDM\Dokter_Controller;
use App\Http\Controllers\Module\SDM\Staff_Controller;
use App\Http\Controllers\Module\Pasien\PasienController;
use App\Http\Controllers\Module\SDM\Perawat_Controller;
use App\Http\Controllers\Module\Pembelian\Pembelian_Controller;
use App\Http\Controllers\Module\Pelayanan\PelayananController;
use App\Http\Controllers\Module\Pelayanan\Pelayanan_So_Perawat_Controller;
use App\Http\Controllers\Module\Pelayanan\Pelayanan_Soap_Dokter_Controller;
use App\Http\Controllers\Module\Pelayanan\Pelayanan_Soap_Bidan_Controller;
use App\Http\Controllers\Module\Pelayanan\Pelayanan_Rujukan_Controller;
use App\Http\Controllers\Module\Pelayanan\Pelayanan_Permintaan_Controller;
use App\Http\Controllers\Module\Pelayanan\Dokter_Rujukan_Controller;
use App\Http\Controllers\Module\Gudang\Stok_Barang_Controller;
use App\Http\Controllers\Module\Gudang\Stok_Inventaris_Controller;
use App\Http\Controllers\Module\Gudang\Stok_Obat_Klinik_Controller;
use App\Http\Controllers\Module\Gudang\Stok_Inventaris_Klinik_Controller;
use App\Http\Controllers\Module\Gudang\Permintaan_Barang_Controller;
use App\Http\Controllers\Module\Gudang\Daftar_Permintaan_Barang_Controller;
use App\Http\Controllers\Module\Apotek\Apotek_Controller;
use App\Http\Controllers\Module\Kasir\Kasir_Controller;
use App\Http\Controllers\Module\Laporan\Laporan_Controller;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;

// SDM
Route::middleware(['auth'])->prefix('sdm')->as('sdm.')->group(function () {

    // Dokter
    Route::get('/dokter', [Dokter_Controller::class, 'index'])->name('dokter.index');
    Route::post('/dokter', [Dokter_Controller::class, 'store'])->name('dokter.store');
    Route::put('/dokter/{dokter}', [Dokter_Controller::class, 'update'])->name('dokter.update');
    Route::delete('/dokter/{dokter}', [Dokter_Controller::class, 'destroy'])->name('dokter.destroy');

    // Perawat
    Route::get('/perawat', [Perawat_Controller::class, 'index'])->name('perawat.index');
    Route::post('/perawat', [Perawat_Controller::class, 'store'])->name('perawat.store');
    Route::put('/perawat/{perawat}', [Perawat_Controller::class, 'update'])->name('perawat.update');
    Route::delete('/perawat/{perawat}', [Perawat_Controller::class, 'destroy'])->name('perawat.destroy');
    // Perawat - verifikasi
    Route::post('/perawat/verifikasi', [Perawat_Controller::class, 'verifikasi'])->name('perawat.verifikasi');

    // Dokter - verifikasi
    Route::post('/dokter/verifikasi', [Dokter_Controller::class, 'verifikasi'])->name('dokter.verifikasi');
    // Dokter - jadwal
    Route::post('/dokter/jadwal', [Dokter_Controller::class, 'jadwal'])->name('dokter.jadwal');
    Route::delete('/dokter/jadwal', [Dokter_Controller::class, 'hapusJadwal'])->name('dokter.jadwal.hapus');

    // Staff
    Route::get('/staff', [Staff_Controller::class, 'index'])->name('staff.index');
    Route::post('/staff', [Staff_Controller::class, 'store'])->name('staff.store');
    Route::put('/staff/{staff}', [Staff_Controller::class, 'update'])->name('staff.update');
    Route::delete('/staff/{staff}', [Staff_Controller::class, 'destroy'])->name('staff.destroy');

    // Staff wilayah endpoints
    Route::get('/staff/kabupaten/{provinceId}', [Staff_Controller::class, 'getKabupaten'])->name('staff.kabupaten');
    Route::get('/staff/kecamatan/{cityId}', [Staff_Controller::class, 'getKecamatan'])->name('staff.kecamatan');
    Route::get('/staff/desa/{districtId}', [Staff_Controller::class, 'getDesa'])->name('staff.desa');
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

        Route::get('/kategori-tindakan', [Kategori_Tindakan_Controller::class, 'index'])->name('kategori-tindakan.index');
        Route::post('/kategori-tindakan', [Kategori_Tindakan_Controller::class, 'store'])->name('kategori-tindakan.store');
        Route::put('/kategori-tindakan/{id}', [Kategori_Tindakan_Controller::class, 'update'])->name('kategori-tindakan.update');
        Route::delete('/kategori-tindakan/{id}', [Kategori_Tindakan_Controller::class, 'destroy'])->name('kategori-tindakan.destroy');
    });

    // Grup untuk Gudang
    Route::prefix('gudang')->as('gudang.')->group(function () {
        Route::get('/satuan-barang', [Satuan_Barang_Controller::class, 'index'])->name('satuan-barang.index');
        Route::post('/satuan-barang', [Satuan_Barang_Controller::class, 'store'])->name('satuan-barang.store');
        Route::put('/satuan-barang/{satuanbarang}', [Satuan_Barang_Controller::class, 'update'])->name('satuan-barang.update');
        Route::delete('/satuan-barang/{satuanbarang}', [Satuan_Barang_Controller::class, 'destroy'])->name('satuan-barang.destroy');

        Route::get('/kategori-barang', [Kategori_Barang_Controller::class, 'index'])->name('kategori-barang.index');
        Route::post('/kategori-barang', [Kategori_Barang_Controller::class, 'store'])->name('kategori-barang.store');
        Route::put('/kategori-barang/{kategoribarang}', [Kategori_Barang_Controller::class, 'update'])->name('kategori-barang.update');
        Route::delete('/kategori-barang/{kategoribarang}', [Kategori_Barang_Controller::class, 'destroy'])->name('kategori-barang.destroy');

        Route::get('/supplier', [Supplier_Controller::class, 'index'])->name('supplier.index');
        Route::post('/supplier', [Supplier_Controller::class, 'store'])->name('supplier.store');
        Route::put('/supplier/{supplier}', [Supplier_Controller::class, 'update'])->name('supplier.update');
        Route::delete('/supplier/{supplier}', [Supplier_Controller::class, 'destroy'])->name('supplier.destroy');

        Route::get('/daftar-harga-jual',  [Daftar_Harga_Jual_Controller::class, 'index'])->name('daftar-harga-jual.index');
        Route::post('/daftar-harga-jual', [Daftar_Harga_Jual_Controller::class, 'store'])->name('daftar-harga-jual.store');
        Route::put('/daftar-harga-jual/{daftarHargaJual}', [Daftar_Harga_Jual_Controller::class, 'update'])->name('daftar-harga-jual.update');
        Route::delete('/daftar-harga-jual/{daftarHargaJual}', [Daftar_Harga_Jual_Controller::class, 'destroy'])->name('daftar-harga-jual.destroy');



        // Daftar Harga Jual Klinik
        Route::get('/daftar-harga-jual-klinik',  [Daftar_Harga_Jual_Klinik_Controller::class, 'index'])->name('daftar-harga-jual-klinik.index');
        Route::post('/daftar-harga-jual-klinik', [Daftar_Harga_Jual_Klinik_Controller::class, 'store'])->name('daftar-harga-jual-klinik.store');
        Route::put('/daftar-harga-jual-klinik/{daftarHargaJualKlinik}', [Daftar_Harga_Jual_Klinik_Controller::class, 'update'])->name('daftar-harga-jual-klinik.update');
        Route::delete('/daftar-harga-jual-klinik/{daftarHargaJualKlinik}', [Daftar_Harga_Jual_Klinik_Controller::class, 'destroy'])->name('daftar-harga-jual-klinik.destroy');

        // API routes untuk dialog setting harga jual
        Route::get('/setting-harga-jual/get-settings', [Setting_Harga_Jual_Controller::class, 'getSettings'])
            ->name('setting-harga-jual.get-settings');
        Route::post('/setting-harga-jual', [Setting_Harga_Jual_Controller::class, 'store'])
            ->name('setting-harga-jual.store');
        Route::post('/setting-harga-jual-utama', [Setting_Harga_Jual_Controller::class, 'storeUtama'])
            ->name('setting-harga-jual-utama.store');

        // Routes untuk setting harga jual utama (jika masih diperlukan sebagai page terpisah)
        Route::get('/setting-harga-jual-utama', [Setting_Harga_Jual_Utama_Controller::class, 'index'])->name('setting-harga-jual-utama.index');
        Route::put('/setting-harga-jual-utama/{settingHargaJualUtama}', [Setting_Harga_Jual_Utama_Controller::class, 'update'])->name('setting-harga-jual-utama.update');
        Route::delete('/setting-harga-jual-utama/{settingHargaJualUtama}', [Setting_Harga_Jual_Utama_Controller::class, 'destroy'])->name('setting-harga-jual-utama.destroy');

        Route::get('/daftar-barang', [Daftar_Barang_Controller::class, 'index'])->name('daftar-barang.index');
        Route::post('/daftar-barang', [Daftar_Barang_Controller::class, 'store'])->name('daftar-barang.store');
        Route::put('/daftar-barang/{daftarBarang}', [Daftar_Barang_Controller::class, 'update'])->name('daftar-barang.update');
        Route::delete('/daftar-barang/{daftarBarang}', [Daftar_Barang_Controller::class, 'destroy'])->name('daftar-barang.destroy');
    });
});

Route::get('/', function () {
    return redirect()->route('login'); // Redirect ke route login
})->name('home');


Route::middleware(['auth', 'verified'])->prefix('pasien')->as('pasien.')->group(
    function () {
        Route::post('/store', [PasienController::class, 'store'])->name('store');
        Route::get('/', [PasienController::class, 'index'])->name('index');
        Route::post('/verifikasi', [PasienController::class, 'verifikasi'])->name('verifikasi');
        Route::post('/update', [PasienController::class, 'update'])->name('update');
        Route::post('/panggil/{id}', [PasienController::class, 'panggil'])->name('panggil');
        Route::get('/singkron', [PasienController::class, 'singkron'])->name('singkron');
        Route::get('/kabupaten/{provinceId}', [PasienController::class, 'getKabupaten'])->name('kabupaten');
        Route::get('/kecamatan/{regencyId}', [PasienController::class, 'getKecamatan'])->name('kecamatan');
        Route::get('/desa/{districtId}', [PasienController::class, 'getDesa'])->name('desa');
    }
);

Route::get('/pendaftaran', [Pendaftaran_Controller::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('pendaftaran');

// API master data
Route::prefix('api/master')->group(function () {
    Route::get('/pasien', [Pendaftaran_Controller::class, 'getPasienList']);
    Route::get('/poli', [Pendaftaran_Controller::class, 'getPoliList']);
    Route::get('/penjamin', [Pendaftaran_Controller::class, 'getPenjaminList']);
    Route::post('/dokter/by-poli', [Pendaftaran_Controller::class, 'getDokterByPoli']);
    Route::get('/pasien/search', [Pendaftaran_Controller::class, 'searchPasien']);
    // HTT API
    Route::get('/htt/pemeriksaan', [Htt_Pemeriksaan_Controller::class, 'listAll']);
    Route::get('/htt/subpemeriksaan/{pemeriksaanId}', [Htt_Subpemeriksaan_Controller::class, 'getByPemeriksaan']);
    Route::get('/htt/subpemeriksaan', [Htt_Subpemeriksaan_Controller::class, 'listAll']);
    // Tindakan API - gunakan controller, bukan model langsung
    Route::get('/tindakan', [Tindakan_Controller::class, 'listAll']);
});
Route::get('/pendaftaran-online', [Pendaftaran_online_Controller::class, 'index'])->name('pendaftaran-online');
Route::post('/pendaftaran-online/add', [Pendaftaran_online_Controller::class, 'add'])->name('pendaftaran-online.add');

Route::middleware(['auth', 'verified'])->prefix('pembelian')->as('pembelian.')->group(function () {
    Route::get('/', [Pembelian_Controller::class, 'index'])->name('index');
    Route::post('/add', [Pembelian_Controller::class, 'store'])->name('add');
});

Route::middleware(['auth', 'verified'])->prefix('gudang')->as('gudang.')->group(function () {
    Route::get('/stok-barang', [Stok_Barang_Controller::class, 'index'])->name('stok-barang.index');
    Route::post('/stok-barang/penyesuaian', [Stok_Barang_Controller::class, 'penyesuaian'])->name('stok-barang.penyesuaian');
    Route::get('/stok-inventaris', [Stok_Inventaris_Controller::class, 'index'])->name('stok-inventaris.index');
    Route::post('/stok-inventaris/penyesuaian', [Stok_Inventaris_Controller::class, 'penyesuaian'])->name('stok-inventaris.penyesuaian');
    Route::get('/stok-obat-klinik', [Stok_Obat_Klinik_Controller::class, 'index'])->name('stok-obat-klinik.index');
    Route::post('/stok-obat-klinik/penyesuaian', [Stok_Obat_Klinik_Controller::class, 'penyesuaian'])->name('stok-obat-klinik.penyesuaian');
    Route::get('/stok-inventaris-klinik', [Stok_Inventaris_Klinik_Controller::class, 'index'])->name('stok-inventaris-klinik.index');
    Route::post('/stok-inventaris-klinik/penyesuaian', [Stok_Inventaris_Klinik_Controller::class, 'penyesuaian'])->name('stok-inventaris-klinik.penyesuaian');

    // Permintaan Barang
    Route::get('/permintaan-barang', [Permintaan_Barang_Controller::class, 'index'])->name('permintaan-barang.index');
    Route::post('/permintaan-barang', [Permintaan_Barang_Controller::class, 'store'])->name('permintaan-barang.store');

    Route::get('/daftar-permintaan-barang', [Daftar_Permintaan_Barang_Controller::class, 'index'])->name('daftar-permintaan-barang.index');
    Route::post('/daftar-permintaan-barang/konfirmasi', [Daftar_Permintaan_Barang_Controller::class, 'konfirmasi'])->name('daftar-permintaan-barang.konfirmasi');
});

// Pelayanan routes
Route::middleware(['auth', 'verified'])->prefix('pelayanan')->as('pelayanan.')->group(function () {
    Route::get('/so-perawat', [Pelayanan_So_Perawat_Controller::class, 'index'])->name('so-perawat.index');
    Route::get('/so-perawat/{norawat}', [Pelayanan_So_Perawat_Controller::class, 'show'])->name('so-perawat.show');
    Route::get('/so-perawat/edit/{norawat}', [Pelayanan_So_Perawat_Controller::class, 'edit'])->name('so-perawat.edit');
    Route::post('/so-perawat', [Pelayanan_So_Perawat_Controller::class, 'store'])->name('so-perawat.store');
    Route::put('/so-perawat/{norawat}', [Pelayanan_So_Perawat_Controller::class, 'update'])->name('so-perawat.update');

    Route::get('/soap-dokter', [Pelayanan_Soap_Dokter_Controller::class, 'index'])->name('soap-dokter.index');
    Route::get('/soap-dokter/{norawat}', [Pelayanan_Soap_Dokter_Controller::class, 'show'])->name('soap-dokter.show');
    Route::get('/soap-dokter/edit/{norawat}', [Pelayanan_Soap_Dokter_Controller::class, 'edit'])->name('soap-dokter.edit');
    Route::get('/soap-dokter/konfirmasi/{norawat}', [Pelayanan_Soap_Dokter_Controller::class, 'konfirmasi'])->name('soap-dokter.konfirmasi');
    Route::post('/soap-dokter/konfirmasi/{norawat}', [Pelayanan_Soap_Dokter_Controller::class, 'storeKonfirmasi'])->name('soap-dokter.konfirmasi.store');
    Route::get('/soap-dokter/files/{norawat}', [Pelayanan_Soap_Dokter_Controller::class, 'getFiles'])->name('soap-dokter.files');
    Route::post('/soap-dokter', [Pelayanan_Soap_Dokter_Controller::class, 'store'])->name('soap-dokter.store');
    Route::put('/soap-dokter/{norawat}', [Pelayanan_Soap_Dokter_Controller::class, 'update'])->name('soap-dokter.update');

    // Soap Bidan (duplikat dari dokter namun render ke view bidan)
    Route::get('/soap-bidan', [Pelayanan_Soap_Bidan_Controller::class, 'index'])->name('soap-bidan.index');
    Route::get('/soap-bidan/{norawat}', [Pelayanan_Soap_Bidan_Controller::class, 'show'])->name('soap-bidan.show');
    Route::get('/soap-bidan/edit/{norawat}', [Pelayanan_Soap_Bidan_Controller::class, 'edit'])->name('soap-bidan.edit');
    Route::get('/soap-bidan/konfirmasi/{norawat}', [Pelayanan_Soap_Bidan_Controller::class, 'konfirmasi'])->name('soap-bidan.konfirmasi');
    Route::post('/soap-bidan/konfirmasi/{norawat}', [Pelayanan_Soap_Bidan_Controller::class, 'storeKonfirmasi'])->name('soap-bidan.konfirmasi.store');
    Route::get('/soap-bidan/files/{norawat}', [Pelayanan_Soap_Bidan_Controller::class, 'getFiles'])->name('soap-bidan.files');
    Route::post('/soap-bidan', [Pelayanan_Soap_Bidan_Controller::class, 'store'])->name('soap-bidan.store');
    Route::put('/soap-bidan/{norawat}', [Pelayanan_Soap_Bidan_Controller::class, 'update'])->name('soap-bidan.update');

    Route::get('/soap-dokter/rujukan/{norawat}', [Dokter_Rujukan_Controller::class, 'index'])->name('soap-dokter.rujukan.show');
    Route::post('/soap-dokter/rujukan', [Dokter_Rujukan_Controller::class, 'store'])->name('soap-dokter.rujukan.store');

    Route::get('/soap-dokter/permintaan/{norawat}', [Pelayanan_Permintaan_Controller::class, 'show'])->name('soap-dokter.permintaan.show');
    Route::post('/soap-dokter/permintaan', [Pelayanan_Permintaan_Controller::class, 'store'])->name('soap-dokter.permintaan.store');
    Route::put('/soap-dokter/permintaan/{norawat}', [Pelayanan_Permintaan_Controller::class, 'update'])->name('soap-dokter.permintaan.update');

    Route::get('/rujukan/{norawat}', [Pelayanan_Rujukan_Controller::class, 'show'])->name('rujukan.show');
    Route::post('/rujukan', [Pelayanan_Rujukan_Controller::class, 'store'])->name('rujukan.store');
    Route::put('/rujukan/{norawat}', [Pelayanan_Rujukan_Controller::class, 'update'])->name('rujukan.update');
    Route::get('/rujukan/cetak/{norawat}', [Pelayanan_Rujukan_Controller::class, 'cetakSuratRujukan'])->name('rujukan.cetak');

    Route::get('/permintaan/{norawat}', [Pelayanan_Permintaan_Controller::class, 'show'])->name('permintaan.show');
    Route::post('/permintaan', [Pelayanan_Permintaan_Controller::class, 'store'])->name('permintaan.store');
    Route::put('/permintaan/{norawat}', [Pelayanan_Permintaan_Controller::class, 'update'])->name('permintaan.update');
    Route::get('/permintaan/cetak/{norawat}', [Pelayanan_Permintaan_Controller::class, 'cetak'])->name('permintaan.cetak');
});

// Alias tanpa prefix untuk kompatibilitas front-end lama
Route::middleware(['auth', 'verified'])->get('/rujukan/cetak/{norawat}', [Pelayanan_Rujukan_Controller::class, 'cetakSuratRujukan']);

// API routes for pelayanan
Route::middleware(['auth'])->prefix('api/pelayanan')->group(function () { //ini pake api
    Route::get('/', [PelayananController::class, 'index']);
    Route::get('/hadir/{norawat}', [Pelayanan_So_Perawat_Controller::class, 'hadirPasien']);
    Route::delete('/batal/{norawat}', [Pelayanan_So_Perawat_Controller::class, 'batalKunjungan']);
    Route::post('/dokter/update', [PelayananController::class, 'updateDokter']);
    Route::post('/selesai/{norawat}', [Pelayanan_Soap_Dokter_Controller::class, 'selesaiPasien']);
    Route::get('/hadir-dokter/{norawat}', [Pelayanan_Soap_Dokter_Controller::class, 'hadirDokter']);
    Route::post('/selesai-dokter/{norawat}', [Pelayanan_Soap_Dokter_Controller::class, 'selesaiPasien']);

    // CPPT API routes
    Route::get('/cppt/timeline/{nomor_rm}', [PelayananController::class, 'getCpptTimeline']);
});

Route::middleware(['auth', 'verified'])->prefix('apotek')->as('apotek.')->group(function () {
    Route::get('/', [Apotek_Controller::class, 'index'])->name('index');
    Route::post('/add', [Apotek_Controller::class, 'apotekadd'])->name('add');
});

Route::middleware(['auth', 'verified'])->prefix('kasir')->as('kasir.')->group(function () {
    Route::get('/', [Kasir_Controller::class, 'index'])->name('index');
    Route::get('/pembayaran/{kode_faktur}', [Kasir_Controller::class, 'kasirPembayaran'])->name('pembayaran');
    Route::post('/add', [Kasir_Controller::class, 'kasiradd'])->name('add');
});

Route::middleware(['auth', 'verified'])->prefix('laporan')->as('laporan.')->group(function () {
    Route::get('/antrian', [Laporan_Controller::class, 'pendataan_antrian'])->name('antrian');
    // removed print_antrian
    Route::post('/antrian/export', [Laporan_Controller::class, 'export_antrian'])->name('antrian.export');

    Route::get('/pendaftaran', [Laporan_Controller::class, 'pendataan_pendaftaran'])->name('pendaftaran');
    // removed print_pendaftaran
    Route::post('/pendaftaran/export', [Laporan_Controller::class, 'export_pendaftaran'])->name('pendaftaran.export');

    Route::get('/trend-pendaftaran', [Laporan_Controller::class, 'pendataan_trend_pendaftaran'])->name('trend-pendaftaran');
    Route::post('/trend-pendaftaran/export', [Laporan_Controller::class, 'export_trend_pendaftaran'])->name('trend-pendaftaran.export');
    Route::get('/top-icd10', [Laporan_Controller::class, 'top_icd10'])->name('top-icd10');
    Route::post('/top-icd10/export', [Laporan_Controller::class, 'export_top_icd10'])->name('top-icd10.export');

    Route::get('/dokter', [Laporan_Controller::class, 'pendataan_dokter'])->name('dokter');
    // removed print_dokter and print_dokter_detail
    Route::post('/dokter/export', [Laporan_Controller::class, 'export_dokter'])->name('dokter.export');

    Route::get('/perawat', [Laporan_Controller::class, 'pendataan_perawat'])->name('perawat');
    // removed print_perawat and print_perawat_detail
    Route::post('/perawat/export', [Laporan_Controller::class, 'export_perawat'])->name('perawat.export');

    Route::get('/apotek', [Laporan_Controller::class, 'apotek'])->name('apotek');
    // removed print_apotek
    Route::post('/apotek/export', [Laporan_Controller::class, 'export_apotek'])->name('apotek.export');

    Route::get('/stok-penyesuaian', [Laporan_Controller::class, 'laporan_stok_penyesuaian'])->name('stok-penyesuaian');
    // removed print_stok_penyesuaian
    Route::post('/stok-penyesuaian/export', [Laporan_Controller::class, 'export_stok_penyesuaian'])->name('stok-penyesuaian.export');

    Route::get('/kasir', [Laporan_Controller::class, 'kasir'])->name('kasir');
    // removed print_kasir
    Route::post('/kasir/export', [Laporan_Controller::class, 'export_kasir'])->name('kasir.export');

    // API untuk ambil detail kasir per invoice (tempatkan sebelum route parameter)
    Route::get('/kasir-detail/data', [Laporan_Controller::class, 'kasir_detail_data'])->name('kasir-detail.data');
    // Print detail: dukung tanpa parameter kode_faktur (data dikirim dari client)
    // removed kasir_detail_print

    // Pembelian
    Route::get('/pembelian', [Laporan_Controller::class, 'pembelian'])->name('pembelian');
    // removed print_pembelian
    Route::post('/pembelian/export', [Laporan_Controller::class, 'export_pembelian'])->name('pembelian.export');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
