<?php

namespace App\Http\Controllers\Module\Integrasi\BPJS;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use LZCompressor\LZString;
use Illuminate\Support\Facades\Log;

class Satu_Sehat_Controller extends Controller
{
    /**
     * Ambil token BPJS
     */
    private function get_token()
    {
        $config = [
            'SATUSEHAT_BASE_URL' => 'https://api-satusehat.kemkes.go.id',
            'client_id' => 'f9P1MFTYAF453MLbBx5y5sqQPM1xU3zLGrKiGptYCEhWgtvk',
            'client_secret' => 'd4yvu7PgVlZe2pZhAvpeFDMKhnTfVAkkwLP4cqSbZgdNi2rqeJPVYoLDDnWpOXbS',
            'grant_type' => 'client_credentials',
        ];

        $response = Http::asForm()->withHeaders([
            'Content-Type' => 'application/x-www-form-urlencoded',
            'User-Agent' => 'PostmanRuntime/7.26.10',
        ])->post($config['SATUSEHAT_BASE_URL'] . '/oauth2/v1/accesstoken?grant_type=client_credentials', [
            'client_id' => $config['client_id'],
            'client_secret' => $config['client_secret'],            
        ]);

        return [
            'access_token'=> $response->json('access_token'),
        ];
    }


    /**
     * Dekripsi dan dekompresi response BPJS
     */
    public function get_kfa_obat($type, $nama)
    {
        
        $config = [
            'SATUSEHAT_BASE_URL' => 'https://api-satusehat.kemkes.go.id',
            'client_id' => 'f9P1MFTYAF453MLbBx5y5sqQPM1xU3zLGrKiGptYCEhWgtvk',
            'client_secret' => 'd4yvu7PgVlZe2pZhAvpeFDMKhnTfVAkkwLP4cqSbZgdNi2rqeJPVYoLDDnWpOXbS',            
        ];
        $feature = '/kfa-v2/products/all?page=1&size=1000&product_type='.$type.'&keyword=';
        $maxRetries = 3;
        $data = null;
        $responseTime = 0;


         // Ambil token hanya sekali
        $token = $this->get_token();

        if (!$token) {
            return response()->json(['error' => 'Unable to obtain access token'], 500);
        }

        $headers = array_merge([
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $token['access_token']
        ]);
        // Cek nama KFA
        if (empty($nama)) {
            return response()->json(['error' => 'Nama KFA tidak boleh kosong'], 400);
        }

        for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
            try {
                $startTime = microtime(true);

                // Kirim permintaan ke API
                $response = Http::withHeaders($headers)->get("{$config['SATUSEHAT_BASE_URL']}/{$feature}{$nama}");

                $endTime = microtime(true);
                $responseTime = round(($endTime - $startTime) * 1000, 2); // dalam milidetik
                if ($response->successful()) {
                    $responseBody = $response->json();

                    // Filter data active == true dan ambil field yang dibutuhkan
                    $filteredData = collect($responseBody['items']['data'] ?? [])
                        ->where('active', true)
                        ->map(function ($item) {
                            return [
                                'name' => $item['name'] ?? '',
                                'name_dagang' => $item['nama_dagang'] ?? '',
                                'kfa_code' => $item['kfa_code'] ?? '',
                                'manufacturer' => $item['manufacturer'] ?? '',                                
                            ];
                        })
                        ->values(); // Reset index array

                    $data = $filteredData;
                    break; // Keluar dari loop jika berhasil
                }

            } catch (\Exception $e) {
                if ($attempt >= $maxRetries - 1) {
                    return response()->json([
                        'status' => 'error',
                        'message' => $e->getMessage(),
                        'response_time_ms' => $responseTime
                    ], 400);
                }
            }
        }

        return response()->json([
            "status" => "success",
            "data" => $data,
            "response_time_ms" => $responseTime
        ]);

    }

}
