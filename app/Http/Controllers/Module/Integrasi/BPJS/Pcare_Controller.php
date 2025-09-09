<?php

namespace App\Http\Controllers\Module\Integrasi\BPJS;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use LZCompressor\LZString;
use Illuminate\Support\Facades\Log;
use App\Models\Settings\Set_Bpjs;

class Pcare_Controller extends Controller
{
    /**
     * Ambil token BPJS
     */
    private function token(): array
    {         
        $bpjsConfig = Set_Bpjs::first();
        
        if (!$bpjsConfig) {
            throw new \Exception('Konfigurasi BPJS tidak ditemukan di database');
        }
 
        $cons_id = $bpjsConfig->CONSID;
        $secret_key = $bpjsConfig->SECRET_KEY;
        $username = $bpjsConfig->USERNAME;
        $password = $bpjsConfig->PASSWORD;
        $user_key = $bpjsConfig->USER_KEY;
        // APP_CODE sekarang diambil dari .env (kolom di DB sudah dihapus)
        $app_code = env('BPJS_App_code', '095');
        
        date_default_timezone_set('UTC');
        $timestamp = strval(time());

        $signature = base64_encode(hash_hmac('sha256', "{$cons_id}&{$timestamp}", $secret_key, true));

        $authorization = "Basic " . base64_encode("{$username}:{$password}:{$app_code}");

        return [
            'headers' => [
                'X-cons-id'       => $cons_id,
                'X-Timestamp'     => $timestamp,
                'X-Signature'     => $signature,
                'X-Authorization' => $authorization,
                'user_key'        => $user_key,
            ],
            'key_decrypt' => $cons_id . $secret_key . $timestamp,
        ];
    }

    /**
     * Dekripsi dan dekompresi response BPJS
     */
    private function decryptBpjsResponse(string $encryptedString, array $token): ?array
    {
        try {
            // 🔑 Generate key dan IV
            $key_hash = hex2bin(hash('sha256', $token['key_decrypt']));
            $iv = substr($key_hash, 0, 16);

            // 🔓 Dekripsi
            $decrypted = openssl_decrypt(
                base64_decode($encryptedString),
                'AES-256-CBC',
                $key_hash,
                OPENSSL_RAW_DATA,
                $iv
            );

            if (!$decrypted) {
                Log::warning('Dekripsi gagal', ['encrypted' => $encryptedString]);
                return null;
            }

            // 📦 Dekompresi LZString
            $jsonString = LZString::decompressFromEncodedURIComponent($decrypted);
            if (!$jsonString) {
                Log::warning('Dekompresi gagal', ['decrypted' => $decrypted]);
                return null;
            }

            // 📄 Konversi JSON ke array
            $data = json_decode($jsonString, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::warning('JSON decode gagal', ['json' => $jsonString]);
                return null;
            }

            return $data;
        } catch (\Exception $e) {
            Log::error('Error dekripsi BPJS', ['message' => $e->getMessage()]);
            return null;
        }
    }

    /**
    * Kunjungan
    */ 
    public function get_rujukan($nokunjung)
    {
        $BASE_URL = "https://apijkn-dev.bpjs-kesehatan.go.id";
        $SERVICE_NAME = "pcare-rest-dev";
        $feature = 'kunjungan/rujukan';
        $token = $this->token(); // ambil cons_id, secret_key, timestamp, headers

        try {
            $startTime = microtime(true);

            // Request ke BPJS
            $response = Http::withHeaders(array_merge(
                ['Content-Type' => 'application/json; charset=utf-8'],
                $token['headers']
            ))->get("{$BASE_URL}/{$SERVICE_NAME}/{$feature}/{$nokunjung}");

            $body = json_decode($response->body(), true);
            $responseTime = microtime(true) - $startTime;

            // Jika error metadata
            if (($body['metaData']['code'] ?? 0) != 200 || empty($body['response'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => $body['metaData']['message'] ?? 'Permintaan BPJS gagal',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }

            // Dekripsi
            $data = $this->decryptBpjsResponse($body['response'], $token);

            if (!$data || empty($data['response'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak ditemukan',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }


            return response()->json([
                'status' => 'success',
                'data' => $data['response'],
                'response_time' => number_format($responseTime, 2)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'response_time' => number_format(microtime(true) - $startTime, 2)
            ], 500);
        }
    }
    /**
    * Kunjungan
    */ 

    /**
     * Ambil daftar Poli FKTP BPJS
     */
    public function get_poli()
    {
        $BASE_URL = env('BPJS_BaseUrl');
        $SERVICE_NAME = env('BPJS_Pcare_Service');
        $feature = 'poli/fktp';
        $token = $this->token(); // ambil cons_id, secret_key, timestamp, headers

        try {
            $startTime = microtime(true);

            // Request ke BPJS
            $response = Http::withHeaders(array_merge(
                ['Content-Type' => 'application/json; charset=utf-8'],
                $token['headers']
            ))->get("{$BASE_URL}/{$SERVICE_NAME}/{$feature}/0/500");

            $body = json_decode($response->body(), true);
            $responseTime = microtime(true) - $startTime;

            // Jika error metadata
            if (($body['metaData']['code'] ?? 0) != 200 || empty($body['response'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => $body['metaData']['message'] ?? 'Permintaan BPJS gagal',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }


            // Dekripsi
            $data = $this->decryptBpjsResponse($body['response'], $token);

            if (!$data || empty($data['list'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak ditemukan',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }

            // Transformasi hasil
            $transformed = array_map(fn($p) => [
                'kode'  => $p['kdPoli'],
                'nama'  => $p['nmPoli'],
                'jenis' => ($p['poliSakit'] ?? false) ? 'pengobatan penyakit' : 'pelayanan kesehatan'
            ], $data['list']);

            return response()->json([
                'status' => 'success',
                'data' => $transformed,
                'response_time' => number_format($responseTime, 2)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'response_time' => number_format(microtime(true) - $startTime, 2)
            ], 500);
        }
    }

    public function get_alergi($kode)
    {
        $BASE_URL = env('BPJS_BaseUrl');
        $SERVICE_NAME = env('BPJS_Pcare_Service');
        $feature = 'alergi/jenis';
        $token = $this->token(); // ambil cons_id, secret_key, timestamp, headers

        try {
            $startTime = microtime(true);

            // Request ke BPJS
            $response = Http::withHeaders(array_merge(
                ['Content-Type' => 'application/json; charset=utf-8'],
                $token['headers']
            ))->get("{$BASE_URL}/{$SERVICE_NAME}/{$feature}/{$kode}");

            $body = json_decode($response->body(), true);
            $responseTime = microtime(true) - $startTime;

            // Jika error metadata
            if (($body['metaData']['code'] ?? 0) != 200 || empty($body['response'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => $body['metaData']['message'] ?? 'Permintaan BPJS gagal',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }


            // Dekripsi
            $data = $this->decryptBpjsResponse($body['response'], $token);

            if (!$data || empty($data['list'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak ditemukan',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }

            // Transformasi hasil
            $jenisMapping = [
                '01' => 'Makanan',
                '02' => 'Udara',
                '03' => 'Obat',
            ];

            $transformed = array_map(fn($p) => [
                'kode'  => $p['kdAlergi'],
                'nama'  => $p['nmAlergi'],
                'jenis' => $jenisMapping[$kode] ?? 'Lainnya'
            ], $data['list']);


            return response()->json([
                'status' => 'success',
                'data' => $transformed,
                'response_time' => number_format($responseTime, 2)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'response_time' => number_format(microtime(true) - $startTime, 2)
            ], 500);
        }
    }

    public function get_diagnosa($nama)
    {
        $BASE_URL = env('BPJS_BaseUrl');
        $SERVICE_NAME = env('BPJS_Pcare_Service');
        $feature = 'diagnosa';
        $token = $this->token(); // ambil cons_id, secret_key, timestamp, headers

        try {
            $startTime = microtime(true);

            // Request ke BPJS
            $response = Http::withHeaders(array_merge(
                ['Content-Type' => 'application/json; charset=utf-8'],
                $token['headers']
            ))->get("{$BASE_URL}/{$SERVICE_NAME}/{$feature}/{$nama}/0/100");

            $body = json_decode($response->body(), true);
            $responseTime = microtime(true) - $startTime;

            // Jika error metadata
            if (($body['metaData']['code'] ?? 0) != 200 || empty($body['response'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => $body['metaData']['message'] ?? 'Permintaan BPJS gagal',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }


            // Dekripsi
            $data = $this->decryptBpjsResponse($body['response'], $token);

            if (!$data || empty($data['list'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak ditemukan',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }

            $transformed = array_map(fn($p) => [
                'kode'  => $p['kdDiag'],
                'nama'  => $p['nmDiag'],
                'status_rujuk' => !empty($p['nonSpesialis']) ? 'TIDAK' : 'YA',
            ], $data['list']);


            return response()->json([
                'status' => 'success',
                'data' => $transformed,
                'response_time' => number_format($responseTime, 2)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'response_time' => number_format(microtime(true) - $startTime, 2)
            ], 500);
        }
    }

    public function get_sarana()
    {
        $BASE_URL = env('BPJS_BaseUrl');
        $SERVICE_NAME = env('BPJS_Pcare_Service');
        $feature = 'spesialis/sarana';
        $token = $this->token(); // ambil cons_id, secret_key, timestamp, headers

        try {
            $startTime = microtime(true);

            // Request ke BPJS
            $response = Http::withHeaders(array_merge(
                ['Content-Type' => 'application/json; charset=utf-8'],
                $token['headers']
            ))->get("{$BASE_URL}/{$SERVICE_NAME}/{$feature}");

            $body = json_decode($response->body(), true);
            $responseTime = microtime(true) - $startTime;

            // Jika error metadata
            if (($body['metaData']['code'] ?? 0) != 200 || empty($body['response'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => $body['metaData']['message'] ?? 'Permintaan BPJS gagal',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }


            // Dekripsi
            $data = $this->decryptBpjsResponse($body['response'], $token);

            if (!$data || empty($data['list'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak ditemukan',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }

            $transformed = array_map(fn($p) => [
                'kode'  => $p['kdSarana'],
                'nama'  => $p['nmSarana']
            ], $data['list']);


            return response()->json([
                'status' => 'success',
                'data' => $transformed,
                'response_time' => number_format($responseTime, 2)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'response_time' => number_format(microtime(true) - $startTime, 2)
            ], 500);
        }
    }

    public function get_spesialis()
    {
        $BASE_URL = env('BPJS_BaseUrl');
        $SERVICE_NAME = env('BPJS_Pcare_Service');
        $feature = 'spesialis';
        $token = $this->token(); // ambil cons_id, secret_key, timestamp, headers

        try {
            $startTime = microtime(true);

            // Request ke BPJS
            $response = Http::withHeaders(array_merge(
                ['Content-Type' => 'application/json; charset=utf-8'],
                $token['headers']
            ))->get("{$BASE_URL}/{$SERVICE_NAME}/{$feature}");

            $body = json_decode($response->body(), true);
            $responseTime = microtime(true) - $startTime;

            // Jika error metadata
            if (($body['metaData']['code'] ?? 0) != 200 || empty($body['response'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => $body['metaData']['message'] ?? 'Permintaan BPJS gagal',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }


            // Dekripsi
            $data = $this->decryptBpjsResponse($body['response'], $token);

            if (!$data || empty($data['list'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak ditemukan',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }

            $transformed = array_map(fn($p) => [
                'kode'  => $p['kdSpesialis'],
                'nama'  => $p['nmSpesialis']
            ], $data['list']);


            return response()->json([
                'status' => 'success',
                'data' => $transformed,
                'response_time' => number_format($responseTime, 2)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'response_time' => number_format(microtime(true) - $startTime, 2)
            ], 500);
        }
    }

    public function get_sub_spesialis($kode)
    {
        $BASE_URL = env('BPJS_BaseUrl');
        $SERVICE_NAME = env('BPJS_Pcare_Service');
        $feature = 'spesialis';
        $token = $this->token(); // ambil cons_id, secret_key, timestamp, headers

        try {
            $startTime = microtime(true);

            // Request ke BPJS
            $response = Http::withHeaders(array_merge(
                ['Content-Type' => 'application/json; charset=utf-8'],
                $token['headers']
            ))->get("{$BASE_URL}/{$SERVICE_NAME}/{$feature}/{$kode}/subspesialis");

            $body = json_decode($response->body(), true);
            $responseTime = microtime(true) - $startTime;

            // Jika error metadata
            if (($body['metaData']['code'] ?? 0) != 200 || empty($body['response'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => $body['metaData']['message'] ?? 'Permintaan BPJS gagal',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }


            // Dekripsi
            $data = $this->decryptBpjsResponse($body['response'], $token);

            if (!$data || empty($data['list'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak ditemukan',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }

            $transformed = array_map(fn($p) => [
                'kode'  => $p['kdSubSpesialis'],
                'nama'  => $p['nmSubSpesialis'],
                'poli_rujuk'  => $p['kdPoliRujuk']
            ], $data['list']);


            return response()->json([
                'status' => 'success',
                'data' => $transformed,
                'response_time' => number_format($responseTime, 2)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'response_time' => number_format(microtime(true) - $startTime, 2)
            ], 500);
        }
    }

    public function get_peserta($no)
    {
        $BASE_URL = env('BPJS_BaseUrl');
        $SERVICE_NAME = env('BPJS_Pcare_Service');
        $feature = 'peserta';
        $token = $this->token(); // ambil cons_id, secret_key, timestamp, headers

        $feature_jenis = null;
        if (strlen($no) === 13) {
            $feature_jenis = 'noka';
        } elseif (strlen($no) === 16) {
            $feature_jenis = 'nik';
        } else {
            return response()->json([
                'status' => 'error',
                'message' => 'Nomor peserta tidak valid',
                'response_time' => number_format(0, 2)
            ], 400);
        }
        try {
            $startTime = microtime(true);

            // Request ke BPJS
            $response = Http::withHeaders(array_merge(
                ['Content-Type' => 'application/json; charset=utf-8'],
                $token['headers']
            ))->get("{$BASE_URL}/{$SERVICE_NAME}/{$feature}/{$feature_jenis}/{$no}");

            $body = json_decode($response->body(), true);
            $responseTime = microtime(true) - $startTime;

            // Jika error metadata
            if (($body['metaData']['code'] ?? 0) != 200 || empty($body['response'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => $body['metaData']['message'] ?? 'Permintaan BPJS gagal',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }

            // Dekripsi
            $data = $this->decryptBpjsResponse($body['response'], $token);

            if (!$data || empty($data)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak ditemukan',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'data' => $data,
                'response_time' => number_format($responseTime, 2)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'response_time' => number_format(microtime(true) - $startTime, 2)
            ], 500);
        }
    }

    public function get_dokter()
    {
        $BASE_URL = env('BPJS_BaseUrl');
        $SERVICE_NAME = env('BPJS_Pcare_Service');
        $feature = 'dokter';
        $token = $this->token(); // ambil cons_id, secret_key, timestamp, headers

        try {
            $startTime = microtime(true);

            // Request ke BPJS
            $response = Http::withHeaders(array_merge(
                ['Content-Type' => 'application/json; charset=utf-8'],
                $token['headers']
            ))->get("{$BASE_URL}/{$SERVICE_NAME}/{$feature}/0/100");

            $body = json_decode($response->body(), true);
            $responseTime = microtime(true) - $startTime;

            // Jika error metadata
            if (($body['metaData']['code'] ?? 0) != 200 || empty($body['response'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => $body['metaData']['message'] ?? 'Permintaan BPJS gagal',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }


            // Dekripsi
            $data = $this->decryptBpjsResponse($body['response'], $token);

            if (!$data || empty($data['list'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak ditemukan',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }

            $transformed = array_map(fn($p) => [
                'kode'  => $p['kdDokter'],
                'nama'  => $p['nmDokter']
            ], $data['list']);


            return response()->json([
                'status' => 'success',
                'data' => $transformed,
                'response_time' => number_format($responseTime, 2)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'response_time' => number_format(microtime(true) - $startTime, 2)
            ], 500);
        }
    }

    public function add_pendaftaran($data)
    {
        $BASE_URL = env('BPJS_BaseUrl');
        $SERVICE_NAME = env('BPJS_Pcare_Service');
        $feature = 'pendaftaran';
        $token = $this->token(); // ambil cons_id, secret_key, timestamp, headers

        try {
            $startTime = microtime(true);

            // Request ke BPJS
            $response = Http::withHeaders(array_merge(
                ['Content-Type' => 'application/json; charset=utf-8'],
                $token['headers']
            ))->post("{$BASE_URL}/{$SERVICE_NAME}/{$feature}",$data);

            $body = json_decode($response->body(), true);
            $responseTime = microtime(true) - $startTime;

            $successCodes = [200, 201];

            if (!in_array($body['metaData']['code'] ?? 0, $successCodes) || empty($body['response'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => $body['metaData']['message'] ?? 'Permintaan BPJS gagal',
                    'response_time' => number_format($responseTime, 2),
                    'raw' => $body // opsional
                ], 400);
            }            

            // Dekripsi
            $data = $this->decryptBpjsResponse($body['response'], $token);

            if (!$data || empty($data)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data tidak ditemukan',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'data' => $data,
                'response_time' => number_format($responseTime, 2)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'response_time' => number_format(microtime(true) - $startTime, 2)
            ], 500);
        }
    }

}
