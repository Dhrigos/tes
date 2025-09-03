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
    protected $webSetting;

    public function __construct()
    {
        $this->webSetting = Web_Setting::first();
    }

    /**
     * Kirim event permintaan barang baru
     */
    public function broadcastPermintaanBaru($permintaanData)
    {
        try {
            $kodeKlinik = $this->webSetting->kode_klinik ?? '';
            $isGudangUtama = $this->webSetting->is_gudangutama_active ?? false;

            // Broadcast ke semua klinik dalam grup yang sama
            broadcast(new PermintaanBarangEvent(
                $permintaanData,
                'permintaan_baru',
                $kodeKlinik,
                $isGudangUtama
            ))->toOthers();

            Log::info('WebSocket: Permintaan barang baru berhasil di-broadcast', [
                'kode_klinik' => $kodeKlinik,
                'kode_request' => $permintaanData['kode_request'] ?? ''
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
            $kodeKlinik = $this->webSetting->kode_klinik ?? '';
            $isGudangUtama = $this->webSetting->is_gudangutama_active ?? false;

            broadcast(new PermintaanBarangEvent(
                $konfirmasiData,
                'permintaan_dikonfirmasi',
                $kodeKlinik,
                $isGudangUtama
            ))->toOthers();

            Log::info('WebSocket: Konfirmasi permintaan berhasil di-broadcast', [
                'kode_klinik' => $kodeKlinik,
                'kode_request' => $konfirmasiData['kode_request'] ?? ''
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
            $kodeKlinik = $this->webSetting->kode_klinik ?? '';
            $isGudangUtama = $this->webSetting->is_gudangutama_active ?? false;

            broadcast(new PermintaanBarangEvent(
                $pengirimanData,
                'barang_dikirim',
                $kodeKlinik,
                $isGudangUtama
            ))->toOthers();

            Log::info('WebSocket: Pengiriman barang berhasil di-broadcast', [
                'kode_klinik' => $kodeKlinik,
                'kode_request' => $pengirimanData['kode_request'] ?? ''
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
            $kodeKlinik = $this->webSetting->kode_klinik ?? '';
            $isGudangUtama = $this->webSetting->is_gudangutama_active ?? false;

            broadcast(new PermintaanBarangEvent(
                $penerimaanData,
                'barang_diterima',
                $kodeKlinik,
                $isGudangUtama
            ))->toOthers();

            Log::info('WebSocket: Penerimaan barang berhasil di-broadcast', [
                'kode_klinik' => $kodeKlinik,
                'kode_request' => $penerimaanData['kode_request'] ?? ''
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
