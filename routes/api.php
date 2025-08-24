<?php

use App\Http\Controllers\Module\Integrasi\BPJS\Pcare_Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/get_poli', [Pcare_Controller::class, 'get_poli']);
Route::get('/get_alergi/{kode}', [Pcare_Controller::class, 'get_alergi']);
Route::get('/get_diagnosa/{kode}', [Pcare_Controller::class, 'get_diagnosa']);
Route::get('/get_sarana', [Pcare_Controller::class, 'get_sarana']);
Route::get('/get_spesialis', [Pcare_Controller::class, 'get_spesialis']);
Route::get('/get_sub_spesialis/{kode}', [Pcare_Controller::class, 'get_sub_spesialis']);
Route::get('/get_peserta/{no}', [Pcare_Controller::class, 'get_peserta']);
Route::get('/get_dokter', [Pcare_Controller::class, 'get_dokter']);
