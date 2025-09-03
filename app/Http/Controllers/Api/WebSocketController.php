<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Settings\Web_Setting;
use App\Models\Module\Gudang\Permintaan_Barang;
use App\Models\Module\Gudang\Permintaan_Barang_Detail;
use App\Models\Module\Gudang\Permintaan_Barang_Konfirmasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class WebSocketController extends Controller
{
    /**
     * Get real-time data for permintaan barang
     */
    public function getPermintaanBarangRealtime(Request $request)
    {
        try {
            $webSetting = Web_Setting::first();
            if (!$webSetting) {
                return response()->json([
                    'success' => false,
                    'message' => 'Web setting tidak ditemukan'
                ], 404);
            }

            $kodeKlinik = $webSetting->kode_klinik;
            $isGudangUtama = $webSetting->is_gudangutama_active;

            // Get data based on role
            if ($isGudangUtama) {
                // Gudang utama: lihat semua permintaan
                $permintaan = Permintaan_Barang::with('details')
                    ->orderBy('created_at', 'desc')
                    ->get();
            } else {
                // Klinik cabang: lihat permintaan sendiri
                $permintaan = Permintaan_Barang::with('details')
                    ->where('kode_klinik', $kodeKlinik)
                    ->orderBy('created_at', 'desc')
                    ->get();
            }

            // Get konfirmasi data
            $konfirmasi = Permintaan_Barang_Konfirmasi::where('nama_klinik', $webSetting->nama)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'permintaan' => $permintaan,
                    'konfirmasi' => $konfirmasi,
                    'web_setting' => [
                        'kode_klinik' => $kodeKlinik,
                        'nama_klinik' => $webSetting->nama,
                        'is_gudang_utama' => $isGudangUtama
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get notification count for real-time updates
     */
    public function getNotificationCount(Request $request)
    {
        try {
            $webSetting = Web_Setting::first();
            if (!$webSetting) {
                return response()->json([
                    'success' => false,
                    'message' => 'Web setting tidak ditemukan'
                ], 404);
            }

            $kodeKlinik = $webSetting->kode_klinik;
            $isGudangUtama = $webSetting->is_gudangutama_active;

            $counts = [];

            if ($isGudangUtama) {
                // Gudang utama: hitung semua permintaan berdasarkan status
                $counts['menunggu_konfirmasi'] = Permintaan_Barang::where('status', 0)->count();
                $counts['dikonfirmasi'] = Permintaan_Barang::where('status', 1)->count();
                $counts['diproses'] = Permintaan_Barang::where('status', 2)->count();
                $counts['selesai'] = Permintaan_Barang::where('status', 3)->count();
            } else {
                // Klinik cabang: hitung permintaan sendiri
                $counts['menunggu_konfirmasi'] = Permintaan_Barang::where('kode_klinik', $kodeKlinik)
                    ->where('status', 0)->count();
                $counts['dikonfirmasi'] = Permintaan_Barang::where('kode_klinik', $kodeKlinik)
                    ->where('status', 1)->count();
                $counts['diproses'] = Permintaan_Barang::where('kode_klinik', $kodeKlinik)
                    ->where('status', 2)->count();
                $counts['selesai'] = Permintaan_Barang::where('kode_klinik', $kodeKlinik)
                    ->where('status', 3)->count();
            }

            // Hitung konfirmasi yang sudah siap dikirim
            $counts['siap_kirim'] = Permintaan_Barang_Konfirmasi::where('nama_klinik', $webSetting->nama)->count();

            return response()->json([
                'success' => true,
                'data' => $counts
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get WebSocket connection status
     */
    public function getConnectionStatus()
    {
        try {
            $webSetting = Web_Setting::first();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'websocket_enabled' => true,
                    'kode_klinik' => $webSetting->kode_klinik ?? '',
                    'nama_klinik' => $webSetting->nama ?? '',
                    'is_gudang_utama' => $webSetting->is_gudangutama_active ?? false,
                    'channel_name' => 'permintaan-barang.' . ($webSetting->kode_klinik ?? ''),
                    'timestamp' => now()->toISOString()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }
}
