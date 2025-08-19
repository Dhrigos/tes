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

    // Grup untuk data medis
    Route::prefix('medis')->as('medis.')->group(function () {
        // Route::get('/diagnosa', [DiagnosaController::class, 'index'])->name('diagnosa.index');
        // Route::post('/diagnosa', [DiagnosaController::class, 'store'])->name('diagnosa.store');
        // Route::put('/diagnosa/{diagnosa}', [DiagnosaController::class, 'update'])->name('diagnosa.update');
        // Route::delete('/diagnosa/{diagnosa}', [DiagnosaController::class, 'destroy'])->name('diagnosa.destroy');
    });
});



Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/pasien', function () {
    return Inertia::render('pasien');
})->middleware(['auth', 'verified'])->name('pasien');

Route::get('/pendaftaran', function () {
    return Inertia::render('pendaftaran');
})->name('pendaftaran');



Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
