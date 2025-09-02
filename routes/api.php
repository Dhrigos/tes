<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Module\Pasien\PasienController;
use App\Http\Controllers\Module\Master\Data\Gudang\Daftar_Inventaris_Controller;
use App\Http\Controllers\Module\Integrasi\BPJS\Pcare_Controller;
use App\Http\Controllers\Module\Integrasi\BPJS\Satu_Sehat_Controller;
use App\Http\Controllers\Module\Integrasi\BPJS\Ws_Pcare_Controller;
use App\Http\Controllers\Module\Master\Data\Gudang\Setting_Harga_Jual_Controller;
use App\Http\Controllers\Module\Master\Data\Gudang\Daftar_Obat_Controller;
use App\Http\Controllers\Module\Master\Data\Medis\Poli_Controller;
use App\Http\Controllers\Module\Master\Data\Umum\Penjamin_Controller;
use App\Http\Controllers\Module\Pendaftaran\Pendaftaran_Controller;
use App\Http\Controllers\Module\SDM\Dokter_Controller;
use App\Http\Controllers\Module\Pembelian\Pembelian_Controller;
use App\Http\Controllers\Module\Pelayanan\PelayananController;
use App\Http\Controllers\Settings\Web_Setting_Controller;
use App\Models\Module\Pemdaftaran\Pendaftaran_status;
use App\Http\Controllers\Module\Gudang\Permintaan_Barang_Controller;
use Illuminate\Http\Request;


Route::get('/get_poli', [Pcare_Controller::class, 'get_poli']);
Route::get('/get_alergi/{kode}', [Pcare_Controller::class, 'get_alergi']);
Route::get('/get_diagnosa/{kode}', [Pcare_Controller::class, 'get_diagnosa']);
Route::get('/get_sarana', [Pcare_Controller::class, 'get_sarana']);
Route::get('/get_spesialis', [Pcare_Controller::class, 'get_spesialis']);
Route::get('/get_sub_spesialis/{kode}', [Pcare_Controller::class, 'get_sub_spesialis']);
Route::get('/get_peserta/{no}', [Pcare_Controller::class, 'get_peserta']);
Route::get('/get_dokter', [Pcare_Controller::class, 'get_dokter']);

Route::get('/get_dokter_ws/{kode_poli}/{tanggal}', [Ws_Pcare_Controller::class, 'get_dokter']);
// Pelayanan utility
Route::get('/get-dokter-by-poli/{poliId}', [PelayananController::class, 'getDokterByPoli']);

Route::get('/get_kfa_obat/{type}/{nama}', [Satu_Sehat_Controller::class, 'get_kfa_obat']);


// API untuk Setting Harga Jual (tanpa CSRF, sementara tanpa auth untuk test)
Route::get('/setting-harga-jual/get-settings', [Setting_Harga_Jual_Controller::class, 'getSettings']);
Route::post('/setting-harga-jual', [Setting_Harga_Jual_Controller::class, 'store']);
Route::post('/setting-harga-jual-utama', [Setting_Harga_Jual_Controller::class, 'storeUtama']);
Route::post('/setting-harga-jual/sync-from-utama', [Setting_Harga_Jual_Controller::class, 'syncFromUtama']);

// API master data
Route::prefix('master')->group(function () {
    Route::get('/pasien', [Pendaftaran_Controller::class, 'getPasienList']);
    Route::get('/poli', [Pendaftaran_Controller::class, 'getPoliList']);
    Route::get('/penjamin', [Pendaftaran_Controller::class, 'getPenjaminList']);
    Route::post('/dokter/by-poli', [Pendaftaran_Controller::class, 'getDokterByPoli']);
    Route::get('/hari', [Pendaftaran_Controller::class, 'getHariList']);
    Route::get('/dokter-available', [Dokter_Controller::class, 'getAvailable']);
    Route::get('/pasien/search', [Pendaftaran_Controller::class, 'searchPasien']);
});

// API pendaftaran
Route::prefix('pendaftaran')->group(function () {
    Route::get('/master-data', [Pendaftaran_Controller::class, 'getMasterData']);
    Route::post('/', [Pendaftaran_Controller::class, 'store']);
    Route::post('/batal', [Pendaftaran_Controller::class, 'pendaftaranbatal']);
    Route::post('/hadir', [Pendaftaran_Controller::class, 'pendaftaranhadir']);
    Route::post('/dokter/update', [Pendaftaran_Controller::class, 'updateDokter']);
    Route::get('/data', [Pendaftaran_Controller::class, 'getData']);
});

// API pelayanan
Route::prefix('pelayanan')->group(function () {
    // Konfirmasi hadir (akan menaikkan status_daftar ke 1 jika masih 0).
    Route::get('/hadir/{norawat}', [PelayananController::class, 'hadirPasien']);
    // Tandai pendaftaran selesai (status_daftar = 2)
    Route::post('/selesai-daftar/{norawat}', [PelayananController::class, 'selesaiDaftar']);
    // Hadir dokter dan selesai dokter
    Route::get('/hadir-dokter/{norawat}', [PelayananController::class, 'hadirDokter']);
    Route::post('/selesai-dokter/{norawat}', [PelayananController::class, 'selesaiDokter']);
});

Route::post('/pembelian/generate-faktur', [Pembelian_Controller::class, 'generateFakturPembelian']);
Route::post('/pembelian/generate-inventaris', [Pembelian_Controller::class, 'generatePembelianInventaris']);

Route::post('/generate-kode-inventaris', [Daftar_Inventaris_Controller::class, 'generateKodeInventaris']);
Route::get('/inventaris/list', [Daftar_Inventaris_Controller::class, 'list']);
Route::get('/obat/list', [Daftar_Obat_Controller::class, 'list']);

// Daftar Obat Sync Routes
Route::prefix('daftar-obat-sync')->group(function () {
    Route::get('/status', [Daftar_Obat_Controller::class, 'getSyncStatus']);
    Route::post('/apply', [Daftar_Obat_Controller::class, 'applySync']);
    Route::post('/sync-all', [Daftar_Obat_Controller::class, 'syncAllToRedis']);
    Route::post('/clear', [Daftar_Obat_Controller::class, 'clearSync']);
    Route::get('/redis-data', [Daftar_Obat_Controller::class, 'getFromRedis']);
    Route::get('/recent-actions', [Daftar_Obat_Controller::class, 'getRecentActions']);
});

// Test route
Route::get('/test-setting', function () {
    return response()->json(['status' => 'API is working', 'time' => now()]);
});

// Web Settings API Routes
Route::prefix('web-settings')->group(function () {
    Route::get('/show', [Web_Setting_Controller::class, 'show']);
    Route::post('/update', [Web_Setting_Controller::class, 'update']);
    Route::post('/toggle', [Web_Setting_Controller::class, 'updateToggle']);
    Route::get('/toggle-states', [Web_Setting_Controller::class, 'getToggleStates']);
    Route::post('/set-satusehat', [Web_Setting_Controller::class, 'set_satusehat']);
    Route::post('/set-bpjs', [Web_Setting_Controller::class, 'set_bpjs']);
    Route::post('/set-active-gudang', [Web_Setting_Controller::class, 'setActiveGudangUtama']);
    Route::post('/reset-active-gudang', [Web_Setting_Controller::class, 'resetActiveGudangUtama']);
});

Route::prefix('permintaan-barang')->group(function () {
    Route::get('/get-last-kode', [Permintaan_Barang_Controller::class, 'getLastKode']);
    Route::get('/{kode_request}', [Permintaan_Barang_Controller::class, 'getDetail']);
    Route::get('/get-detail/{kode_request}', [Permintaan_Barang_Controller::class, 'getDetailKonfirmasi']);
});

Route::prefix('daftar-permintaan-barang')->group(function () {
    Route::get('/get-detail/{kode_request}', [Permintaan_Barang_Controller::class, 'getDetail']);
    
    Route::post('/proses-permintaan', function (\Illuminate\Http\Request $request) {
        \Log::info('API Request to /api/daftar-permintaan-barang/proses-permintaan', [
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'headers' => $request->headers->all(),
            'input' => $request->all(),
            'ip' => $request->ip()
        ]);
        
        return app(\App\Http\Controllers\Module\Gudang\Daftar_Permintaan_Barang_Controller::class)->prosesPermintaan($request);
    });
});
