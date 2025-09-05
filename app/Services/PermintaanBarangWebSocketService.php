<?php

namespace App\Services;

use App\Events\PermintaanBarangEvent;
use App\Models\Settings\Web_Setting;
use App\Models\Module\Gudang\Permintaan_Barang;
use App\Models\Module\Gudang\Permintaan_Barang_Detail;
use App\Models\Module\Gudang\Permintaan_Barang_Konfirmasi;
use Illuminate\Support\Facades\Log;

class PermintaanBarangWebSocketService
{
    /**
     * Kirim event permintaan barang baru
     */
    public function broadcastPermintaanBaru($permintaanData)
    {
        try {
            // Ambil web setting fresh setiap kali broadcast
            $webSetting = Web_Setting::first();
            if (!$webSetting) {
                Log::error('WebSocket: Web setting tidak ditemukan');
                return false;
            }

            $kodeKlinik = $webSetting->kode_klinik ?? '';
            $isGudangUtama = $webSetting->is_gudangutama_active ?? false;

            Log::info('WebSocket: Broadcasting permintaan baru', [
                'kode_klinik' => $kodeKlinik,
                'is_gudang_utama' => $isGudangUtama,
                'kode_request' => $permintaanData['kode_request'] ?? '',
                'source_klinik' => $permintaanData['kode_klinik'] ?? ''
            ]);

            Log::info('WebSocket: Permintaan barang baru berhasil di-broadcast', [
                'kode_klinik' => $kodeKlinik,
                'kode_request' => $permintaanData['kode_request'] ?? '',
                'channel' => "permintaan-barang.{$kodeKlinik}"
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('WebSocket: Gagal broadcast permintaan barang baru', [
                'error' => $e->getMessage(),
                'data' => $permintaanData
            ]);
            return false;
        }
    }

    /**
     * Kirim event konfirmasi permintaan
     */
    public function broadcastKonfirmasi($konfirmasiData)
    {
        try {
            // Ambil web setting fresh setiap kali broadcast
            $webSetting = Web_Setting::first();
            if (!$webSetting) {
                Log::error('WebSocket: Web setting tidak ditemukan');
                return false;
            }

            $kodeKlinik = $webSetting->kode_klinik ?? '';
            $isGudangUtama = $webSetting->is_gudangutama_active ?? false;

            Log::info('WebSocket: Broadcasting konfirmasi', [
                'kode_klinik' => $kodeKlinik,
                'is_gudang_utama' => $isGudangUtama,
                'kode_request' => $konfirmasiData['kode_request'] ?? ''
            ]);

            // Tentukan tipe event berdasarkan status
            $eventType = 'permintaan_dikonfirmasi';
            if (isset($konfirmasiData['status']) && (int) $konfirmasiData['status'] === 2) {
                $eventType = 'barang_diproses';
            }

            Log::info('WebSocket: Konfirmasi permintaan berhasil di-broadcast', [
                'kode_klinik' => $kodeKlinik,
                'kode_request' => $konfirmasiData['kode_request'] ?? '',
                'channel' => "permintaan-barang.{$kodeKlinik}"
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('WebSocket: Gagal broadcast konfirmasi permintaan', [
                'error' => $e->getMessage(),
                'data' => $konfirmasiData
            ]);
            return false;
        }
    }

    /**
     * Kirim event pengiriman barang
     */
    public function broadcastPengiriman($pengirimanData)
    {
        try {
            // Ambil web setting fresh setiap kali broadcast
            $webSetting = Web_Setting::first();
            if (!$webSetting) {
                Log::error('WebSocket: Web setting tidak ditemukan');
                return false;
            }

            $kodeKlinik = $webSetting->kode_klinik ?? '';
            $isGudangUtama = $webSetting->is_gudangutama_active ?? false;

            Log::info('WebSocket: Broadcasting pengiriman', [
                'kode_klinik' => $kodeKlinik,
                'is_gudang_utama' => $isGudangUtama,
                'kode_request' => $pengirimanData['kode_request'] ?? ''
            ]);

            Log::info('WebSocket: Pengiriman barang berhasil di-broadcast', [
                'kode_klinik' => $kodeKlinik,
                'kode_request' => $pengirimanData['kode_request'] ?? '',
                'channel' => "permintaan-barang.{$kodeKlinik}"
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('WebSocket: Gagal broadcast pengiriman barang', [
                'error' => $e->getMessage(),
                'data' => $pengirimanData
            ]);
            return false;
        }
    }

    /**
     * Kirim event penerimaan barang
     */
    public function broadcastPenerimaan($penerimaanData)
    {
        try {
            // Ambil web setting fresh setiap kali broadcast
            $webSetting = Web_Setting::first();
            if (!$webSetting) {
                Log::error('WebSocket: Web setting tidak ditemukan');
                return false;
            }

            $kodeKlinik = $webSetting->kode_klinik ?? '';
            $isGudangUtama = $webSetting->is_gudangutama_active ?? false;

            Log::info('WebSocket: Broadcasting penerimaan', [
                'kode_klinik' => $kodeKlinik,
                'is_gudang_utama' => $isGudangUtama,
                'kode_request' => $penerimaanData['kode_request'] ?? ''
            ]);

            Log::info('WebSocket: Penerimaan barang berhasil di-broadcast', [
                'kode_klinik' => $kodeKlinik,
                'kode_request' => $penerimaanData['kode_request'] ?? '',
                'channel' => "permintaan-barang.{$kodeKlinik}"
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('WebSocket: Gagal broadcast penerimaan barang', [
                'error' => $e->getMessage(),
                'data' => $penerimaanData
            ]);
            return false;
        }
    }

    /**
     * Dapatkan data permintaan barang untuk broadcast
     */
    public function getPermintaanDataForBroadcast($kodeRequest)
    {
        try {
            $permintaan = Permintaan_Barang::where('kode_request', $kodeRequest)->first();
            if (!$permintaan) {
                return null;
            }

            $details = Permintaan_Barang_Detail::where('kode_request', $kodeRequest)->get();

            return [
                'kode_request' => $permintaan->kode_request,
                'kode_klinik' => $permintaan->kode_klinik,
                'nama_klinik' => $permintaan->nama_klinik,
                'status' => $permintaan->status,
                'tanggal_input' => $permintaan->tanggal_input,
                'details' => $details,
                'status_text' => $this->getStatusText($permintaan->status)
            ];
        } catch (\Exception $e) {
            Log::error('WebSocket: Gagal mendapatkan data permintaan untuk broadcast', [
                'error' => $e->getMessage(),
                'kode_request' => $kodeRequest
            ]);
            return null;
        }
    }

    /**
     * Dapatkan data konfirmasi untuk broadcast
     */
    public function getKonfirmasiDataForBroadcast($kodeRequest)
    {
        try {
            $konfirmasi = Permintaan_Barang_Konfirmasi::where('kode_request', $kodeRequest)->get();

            return [
                'kode_request' => $kodeRequest,
                'konfirmasi_items' => $konfirmasi,
                'total_items' => $konfirmasi->count()
            ];
        } catch (\Exception $e) {
            Log::error('WebSocket: Gagal mendapatkan data konfirmasi untuk broadcast', [
                'error' => $e->getMessage(),
                'kode_request' => $kodeRequest
            ]);
            return null;
        }
    }

    /**
     * Convert status number ke text
     */
    private function getStatusText($status)
    {
        $statusMap = [
            0 => 'Menunggu Konfirmasi',
            1 => 'Dikonfirmasi',
            2 => 'Diproses',
            3 => 'Selesai',
            4 => 'Dibatalkan'
        ];

        return $statusMap[$status] ?? 'Status Tidak Diketahui';
    }
}
