<?php

namespace App\Http\Controllers\Module\Integrasi\BPJS;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use LZCompressor\LZString;
use Illuminate\Support\Facades\Log;
use App\Models\Settings\Set_Sehat;

class Satu_Sehat_Controller extends Controller
{
    /**
     * Ambil token Satu Sehat dari konfigurasi database
     */
    private function get_token()
    {
        $configModel = Set_Sehat::first();

        if (!$configModel) {
            throw new \Exception('Konfigurasi Satu Sehat tidak ditemukan di database');
        }

        $baseUrl = env('SATUSEHAT_BASE_URL');
        $clientId = $configModel->client_id;
        $clientSecret = $configModel->client_secret;
        $organization = $configModel->org_id;

        if (!$clientId || !$clientSecret) {
            throw new \Exception('Client ID/Secret Satu Sehat belum dikonfigurasi');
        }

        $response = Http::asForm()->post("{$baseUrl}/oauth2/v1/accesstoken?grant_type=client_credentials", [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
        ]);

        if (!$response->successful()) {
            throw new \Exception('Gagal mengambil token Satu Sehat: ' . ($response->json('error_description') ?? $response->body()));
        }

        return [
            'access_token' => $response->json('access_token'),
            'expires_in'   => $response->json('expires_in'),
            'token_type'   => $response->json('token_type'),
            'organization' => $organization,

        ];
    }

    public function get_kfa_obat($type, $nama)
    {
        $baseUrl = env('SATUSEHAT_BASE_URL');
        $feature = "/kfa-v2/products/all?page=1&size=1000&product_type={$type}&keyword=";

        try {
            $startTime = microtime(true);

            // Validasi nama
            if (empty($nama)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Nama KFA tidak boleh kosong',
                    'response_time' => number_format(microtime(true) - $startTime, 2)
                ], 400);
            }

            // Ambil token
            $token = $this->get_token();
            if (!$token) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unable to obtain access token',
                    'response_time' => number_format(microtime(true) - $startTime, 2)
                ], 500);
            }

            // Request ke API
            $response = Http::withHeaders([
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $token['access_token'],
            ])->get(rtrim($baseUrl, '/') . $feature . urlencode($nama));

            $body = $response->json();
            $responseTime = microtime(true) - $startTime;

            // Jika error atau kosong
            if (!$response->successful() || empty($body['items'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => $body['error_description'] ?? $body['metaData']['message'] ?? 'Permintaan KFA gagal',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }

            // Ambil item (handle jika ada struktur berbeda)
            $items = $body['items']['data'] ?? $body['items'] ?? [];

            if (empty($items)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data KFA tidak ditemukan',
                    'response_time' => number_format($responseTime, 2)
                ], 404);
            }

            // Transform data
            $transformed = array_map(fn($p) => [
                'kode'         => $p['kfa_code'] ?? '',
                'nama'         => $p['name'] ?? '',
                'nama_dagang'  => $p['nama_dagang'] ?? '',
                'manufacturer' => $p['manufacturer'] ?? '',
            ], array_filter($items, fn($p) => $p['active'] ?? false));

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

    public function get_peserta($nik)
    {
        $baseUrl = env('SATUSEHAT_BASE_URL');
        $feature = 'fhir-r4/v1/Patient?identifier=';

        try {
            $startTime = microtime(true);

            // Validasi input
            if (empty($nik)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'NIK tidak boleh kosong',
                    'response_time' => number_format(microtime(true) - $startTime, 2)
                ], 400);
            }

            // Ambil token
            $token = $this->get_token();
            if (!$token || empty($token['access_token'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unable to obtain access token',
                    'response_time' => number_format(microtime(true) - $startTime, 2)
                ], 500);
            }

            // Request ke API
            $identifier = urlencode('https://fhir.kemkes.go.id/id/nik|' . $nik);
            $response = Http::withHeaders([
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $token['access_token'],
            ])->get(rtrim($baseUrl, '/') . '/' . $feature . $identifier);

            $body = $response->json();
            $responseTime = microtime(true) - $startTime;

            // Jika error atau tidak ada entry
            if (!$response->successful() || empty($body['entry'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => $body['issue'][0]['diagnostics'] ?? $body['error_description'] ?? 'Permintaan NIK gagal',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }

            // Ambil patientId dari entry
            $patientId = $body['entry'][0]['resource']['id'] ?? null;
            if (!$patientId && !empty($body['entry']) && is_array($body['entry'])) {
                foreach ($body['entry'] as $entry) {
                    if (!empty($entry['resource']['id'])) {
                        $patientId = $entry['resource']['id'];
                        break;
                    }
                }
            }

            return response()->json([
                'status' => 'success',
                'data' => $patientId,
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

    public function get_practitioner($nik)
    {
        $baseUrl = env('SATUSEHAT_BASE_URL');
        $feature = 'fhir-r4/v1/Practitioner?identifier=';

        try {
            $startTime = microtime(true);

            // Validasi input
            if (empty($nik)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'NIK tidak boleh kosong',
                    'response_time' => number_format(microtime(true) - $startTime, 2)
                ], 400);
            }

            // Ambil token
            $token = $this->get_token();
            if (!$token || empty($token['access_token'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unable to obtain access token',
                    'response_time' => number_format(microtime(true) - $startTime, 2)
                ], 500);
            }

            // Request ke API
            $identifier = urlencode('https://fhir.kemkes.go.id/id/nik|' . $nik);
            $response = Http::withHeaders([
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $token['access_token'],
            ])->get(rtrim($baseUrl, '/') . '/' . $feature . $identifier);

            $body = $response->json();
            $responseTime = microtime(true) - $startTime;

            // Jika error atau tidak ada entry
            if (!$response->successful() || empty($body['entry'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => $body['issue'][0]['diagnostics'] ?? $body['error_description'] ?? 'Permintaan NIK gagal',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }

            // Ambil patientId dari entry
            $patientId = $body['entry'][0]['resource']['id'] ?? null;
            if (!$patientId && !empty($body['entry']) && is_array($body['entry'])) {
                foreach ($body['entry'] as $entry) {
                    if (!empty($entry['resource']['id'])) {
                        $patientId = $entry['resource']['id'];
                        break;
                    }
                }
            }

            return response()->json([
                'status' => 'success',
                'data' => $patientId,
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

    public function get_location()
    {
        $baseUrl = env('SATUSEHAT_BASE_URL');
        $feature = 'fhir-r4/v1/Location?organization=';

        try {
            $startTime = microtime(true);
            // Ambil token
            $token = $this->get_token();
            if (!$token || empty($token['access_token'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unable to obtain access token',
                    'response_time' => number_format(microtime(true) - $startTime, 2)
                ], 500);
            }

            // Request ke API
            $response = Http::withHeaders([
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $token['access_token'],
            ])->get(rtrim($baseUrl, '/') . '/' . $feature . $token['organization']);

            $body = $response->json();
            $responseTime = microtime(true) - $startTime;

            // Jika error atau tidak ada entry
            if (!$response->successful() || empty($body['entry'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => $body['issue'][0]['diagnostics'] ?? $body['error_description'] ?? 'Permintaan NIK gagal',
                    'response_time' => number_format($responseTime, 2)
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'data' => $body,
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
