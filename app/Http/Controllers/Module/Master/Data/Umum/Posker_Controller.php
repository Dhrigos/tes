<?php

namespace App\Http\Controllers\Module\Master\Data\Umum;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Manajemen\Posker;

class Posker_Controller extends Controller
{
    public function index()
    {
        $poskers = Posker::all();
        return view('module.master.data.umum.posker.index', compact('poskers'));
    }
}
