<?php

namespace App\Http\Controllers\Module\Integrasi\BPJS;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use LZCompressor\LZString;
use Illuminate\Support\Facades\Log;

class Ws_Pcare_Controller extends Controller
{
    /**
     * Ambil token BPJS
     */
    private function token(): array
    {
        $cons_id = "18578";
        $secret_key = "9hRE658C601";
        $username = "0221U119_Piraini";
        $password = "Omega*0725";
        $app_code = "095";
        $user_key = "fa32cefbe6c478f7c84c644f50366c1d";

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

    public function get_poli($tanggal)
    {
        $BASE_URL = "https://apijkn.bpjs-kesehatan.go.id";
        $SERVICE_NAME = "antreanfktp";
        $feature = 'ref/poli/tanggal';
        $token = $this->token(); // ambil cons_id, secret_key, timestamp, headers

        try {
            $startTime = microtime(true);

            // Request ke BPJS
            $response = Http::withHeaders(array_merge(
                ['Content-Type' => 'application/json; charset=utf-8'],
                $token['headers']
            ))->get("{$BASE_URL}/{$SERVICE_NAME}/{$feature}/{$tanggal}");

            $body = json_decode($response->body(), true);
            $responseTime = microtime(true) - $startTime;

            // // Jika error metadata atau response kosong
            if (!is_array($body)               
                || empty($body['response'])) {
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

            $transformed = array_map(fn($p) => [
                'kode'  => $p['kodepoli'],
                'nama'  => $p['namapoli'],                
                'kode_sub' => $p['kdsubspesialis'],                
                'nama_sub' => $p['nmsubspesialis'],                
            ], $data);


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
    
    public function get_dokter($kode_poli, $tanggal)
    {
        $BASE_URL = "https://apijkn.bpjs-kesehatan.go.id";
        $SERVICE_NAME = "antreanfktp";
        $feature = 'ref/dokter/kodepoli';
        $token = $this->token(); // ambil cons_id, secret_key, timestamp, headers

        try {
            $startTime = microtime(true);

            // Request ke BPJS
            $response = Http::withHeaders(array_merge(
                ['Content-Type' => 'application/json; charset=utf-8'],
                $token['headers']
            ))->get("{$BASE_URL}/{$SERVICE_NAME}/{$feature}/{$kode_poli}/tanggal/{$tanggal}");

            $body = json_decode($response->body(), true);
            $responseTime = microtime(true) - $startTime;

            // // Jika error metadata atau response kosong
            if (!is_array($body)               
                || empty($body['response'])) {
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

            $transformed = array_map(fn($p) => [
                'kode'  => $p['kodedokter'],
                'nama'  => $p['namadokter'],                
                'jadwal' => $p['jampraktek'],                
                'kuota' => $p['kapasitas'],                
            ], $data);


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

    public function post_antrian($data)
    {
        $BASE_URL = "https://apijkn.bpjs-kesehatan.go.id";
        $SERVICE_NAME = "antreanfktp";
        $feature = 'antrean/add';
        $token = $this->token();

        try {
            $startTime = microtime(true);

            // Request ke BPJS
            $response = Http::withHeaders(array_merge(
                ['Content-Type' => 'application/json; charset=utf-8'],
                $token['headers']
            ))->post("{$BASE_URL}/{$SERVICE_NAME}/{$feature}",$data);

            $body = json_decode($response->body(), true);
            $responseTime = microtime(true) - $startTime;

            // // Jika error metadata atau response kosong
            if (!is_array($body)               
                || empty($body['response'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => $body['metaData']['message'] ?? 'Permintaan BPJS gagal',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'data' => $body['metaData']['message'],
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

    public function update_antrian($data)
    {
        $BASE_URL = "https://apijkn.bpjs-kesehatan.go.id";
        $SERVICE_NAME = "antreanfktp";
        $feature = 'antrean/panggil';
        $token = $this->token();

        try {
            $startTime = microtime(true);

            // Request ke BPJS
            $response = Http::withHeaders(array_merge(
                ['Content-Type' => 'application/json; charset=utf-8'],
                $token['headers']
            ))->post("{$BASE_URL}/{$SERVICE_NAME}/{$feature}",$data);

            $body = json_decode($response->body(), true);
            $responseTime = microtime(true) - $startTime;

            // // Jika error metadata atau response kosong
            if (!is_array($body)               
                || empty($body['response'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => $body['metaData']['message'] ?? 'Permintaan BPJS gagal',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'data' => $body['metaData']['message'],
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

    public function delete_antrian($data)
    {
        $BASE_URL = "https://apijkn.bpjs-kesehatan.go.id";
        $SERVICE_NAME = "antreanfktp";
        $feature = 'antrean/batal';
        $token = $this->token();

        try {
            $startTime = microtime(true);

            // Request ke BPJS
            $response = Http::withHeaders(array_merge(
                ['Content-Type' => 'application/json; charset=utf-8'],
                $token['headers']
            ))->post("{$BASE_URL}/{$SERVICE_NAME}/{$feature}",$data);

            $body = json_decode($response->body(), true);
            $responseTime = microtime(true) - $startTime;

            // // Jika error metadata atau response kosong
            if (!is_array($body)               
                || empty($body['response'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => $body['metaData']['message'] ?? 'Permintaan BPJS gagal',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'data' => $body['metaData']['message'],
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
