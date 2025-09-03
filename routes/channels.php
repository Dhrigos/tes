<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// User channel (optional - hanya jika menggunakan authentication)
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Channel untuk permintaan barang - semua aplikasi dalam grup yang sama dapat akses
Broadcast::channel('permintaan-barang.{kodeKlinik}', function (Request $request, $kodeKlinik) {
    // Semua aplikasi dalam grup yang sama dapat akses channel ini
    // Tidak perlu authentication untuk channel ini
    return true;
});

// Channel untuk notifikasi umum
Broadcast::channel('notifications.{kodeKlinik}', function (Request $request, $kodeKlinik) {
    return true;
});

// Channel untuk status update
Broadcast::channel('status-update.{kodeKlinik}', function (Request $request, $kodeKlinik) {
    return true;
});
