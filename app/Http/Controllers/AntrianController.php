<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AntrianController extends Controller
{
    public function index()
    {
        // Data antrian untuk setiap loket
        $data = [
            'loket_poli_umum' => 1051,
            'loket_poli_gigi' => 1050,
            'loket_poli_kia' => 1049,
        ];

        // Mengirim data ke view
        return view('antrian', $data);
    }
}