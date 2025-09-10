<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;
use App\Models\Settings\Set_Bpjs;
use App\Models\Settings\Web_Setting;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'username' => $request->user()->username,
                    'email' => $request->user()->email,
                    'roles' => $request->user()->getRolesFromPosker(),
                ] : null,
            ],
            'ziggy' => fn(): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            // Share Web Setting so frontend can prefill Advanced section without API call
            'web_setting' => function () {
                $setting = Web_Setting::first();
                if (!$setting) {
                    return null;
                }
                return [
                    'nama' => $setting->nama,
                    'kode_klinik' => $setting->kode_klinik,
                    'kode_group_klinik' => $setting->kode_group_klinik,
                    'alamat' => $setting->alamat,
                    'profile_image' => $setting->profile_image,
                    'is_bpjs_active' => (bool) $setting->is_bpjs_active,
                    'is_satusehat_active' => (bool) $setting->is_satusehat_active,
                    'is_gudangutama_active' => (bool) $setting->is_gudangutama_active,
                ];
            },
            // Share BPJS config to Inertia so frontend can read without calling API
            'set_bpjs' => function () {
                $bpjs = Set_Bpjs::first();
                if (!$bpjs) {
                    return null;
                }
                return [
                    'CONSID' => $bpjs->CONSID,
                    'KPFK' => $bpjs->KPFK,
                    'SECRET_KEY' => $bpjs->SECRET_KEY,
                    'USER_KEY' => $bpjs->USER_KEY,
                    'USERNAME' => $bpjs->USERNAME,
                    'PASSWORD' => $bpjs->PASSWORD,
                ];
            },
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'nomor_antrian' => $request->session()->get('nomor_antrian'),

            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
