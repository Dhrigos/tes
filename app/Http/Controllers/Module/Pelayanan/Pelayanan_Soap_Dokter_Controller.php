<?php

namespace App\Http\Controllers\Module\Pelayanan;

use App\Http\Controllers\Controller;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Pelayanan_Soap_Dokter_Controller extends Controller
{
    public function index() {
        return Inertia::render('module/pelayanan/soap-dokter/index');
    }
}
