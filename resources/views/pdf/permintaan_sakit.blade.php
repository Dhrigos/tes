<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Surat Sakit</title>
    <style>
        @page {
            margin: 5mm 12mm 10mm 12mm;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 9px;
            margin: 0mm;
            padding: 0;
        }

        .divider {
            border-top: 1px solid #000;
            margin: 5px 0;
        }

        .document-title {
            font-size: 11px;
            font-weight: bold;
            margin: 0;
            text-align: center;
        }

        .kode-surat {
            font-size: 9px;
            font-weight: bold;
            margin: 0;
            text-align: center;
        }

        .footer {
            position: fixed;
            bottom: 2px;
            width: 100%;
        }

        .signature-table {
            width: 180%;
            text-align: center;
        }

        .signature-line {
            border-top: 1px solid #000;
            width: 100px;
            margin: 0 auto;
            margin-top: 20px;
        }

        .page-break {
            page-break-after: always;
        }

        /* Ensure spacing around bold inline text within paragraphs */
        p.teks b,
        p.teks strong {
            margin: 0 2px;
        }

        .info-table {
            width: 90%;
            margin: 0;
            margin-left: 10px;
        }

        .info-table td {
            padding: 3px 0;
            vertical-align: top;
            border: none;
        }

        .info-label {
            width: 73px;
        }

        .info-separator {
            width: 10px;
            text-align: center;
        }

        .footer-text {
            font-size: 8px;
        }

        .signature-spacing {
            height: 10px;
        }
    </style>
</head>

<body>
    <table style="width: 100%; margin: 0 0 6px 0;">
        <tr>
            <td style="width: 60px; text-align: center; vertical-align: middle;">
                <img src="{{ public_path('profile/default.png') }}" alt="Logo"
                    style="width: 44px; height: 44px; border-radius: 50%;">
            </td>
            <td style="text-align: center;">
                <div style="font-size: 14px; font-weight: bold; margin: 0;">
                    {{ $namaKlinik }}
                </div>
                <div style="font-size: 9px; line-height: 1.3; margin: 0;">
                    {!! nl2br(e($alamatKlinik)) !!}
                </div>
            </td>
        </tr>
    </table>

    <div class="divider"></div>

    <div class="document-title">SURAT SAKIT</div>

    <p class="teks">Yang bertanda tangan dibawah ini, menerangkan bahwa :</p>

    <table class="info-table" style="width: 100%;">
        <tr>
            <td class="info-label">Nama</td>
            <td class="info-separator">:</td>
            <td>{{ $nama_pasien }}</td>
        </tr>

        <tr>
            <td class="info-label">Umur</td>
            <td class="info-separator">:</td>
            <td>{{ $umur }}</td>
        </tr>

        <tr>
            <td class="info-label">Kelamin/Tgl Lahir</td>
            <td class="info-separator">:</td>
            <td>{{ $jenis_kelamin }} ({{ \Carbon\Carbon::parse($tanggal_lahir)->format('d-m-Y') }})</td>
        </tr>

        <tr>
            <td class="info-label">Alamat</td>
            <td class="info-separator">:</td>
            <td>{{ $alamat }}</td>
        </tr>
    </table>

    <p class="teks">Berdasarkan pemeriksaan yang telah dilakukan, yang bersangkutan dinyatakan<b>&nbsp;SAKIT&nbsp;</b>dengan keterangan sebagai berikut :</p>

    @php
    $listDiagnosisPenyerta = array_values(
    array_filter(
    [$diagnosis_penyerta_1 ?? null, $diagnosis_penyerta_2 ?? null, $diagnosis_penyerta_3 ?? null],
    function ($value) {
    return isset($value) && trim($value) !== '';
    },
    ),
    );

    $listKomplikasi = array_values(
    array_filter([$komplikasi_1 ?? null, $komplikasi_2 ?? null, $komplikasi_3 ?? null], function ($value) {
    return isset($value) && trim($value) !== '';
    }),
    );
    @endphp


    <table class="info-table" style="width: 100%;">
        <tr>
            <td class="info-label">Diagnosis</td>
            <td class="info-separator">:</td>
            <td>{{ $diagnosis_utama }}</td>
        </tr>

        @if (count($listDiagnosisPenyerta) > 0)
        <tr>
            <td class="info-label">Diagnosis Penyerta</td>
            <td class="info-separator">:</td>
            <td>
                @foreach ($listDiagnosisPenyerta as $index => $item)
                {{ $index + 1 }}. {{ $item }}@if (!$loop->last)
                <br>
                @endif
                @endforeach
            </td>
        </tr>
        @endif

        @if (count($listKomplikasi) > 0)
        <tr>
            <td class="info-label">Komplikasi</td>
            <td class="info-separator">:</td>
            <td>
                @foreach ($listKomplikasi as $index => $item)
                {{ $index + 1 }}. {{ $item }}@if (!$loop->last)
                <br>
                @endif
                @endforeach
            </td>
        </tr>
        @endif

        <tr>
            <td class="info-label">Istirahat Selama</td>
            <td class="info-separator">:</td>
            <td>{{ $lama_istirahat ?? 0 }} Hari</td>
        </tr>

        <tr>
            <td class="info-label">Terhitung Mulai</td>
            <td class="info-separator">:</td>
            <td>
                @if ($terhitung_mulai)
                {{ \Carbon\Carbon::parse($terhitung_mulai)->format('d-m-Y') }}
                s.d
                {{ \Carbon\Carbon::parse($terhitung_mulai)->addDays(($lama_istirahat ?? 0) - 1)->format('d-m-Y') }}
                @else
                -
                @endif
            </td>
        </tr>
    </table>

    <p class="teks">Demikian surat sakit ini dibuat dengan sebenar-benarnya dan untuk dipergunakan sebagai mestinya.
    </p>

    <div class="footer">
        <table class="signature-table">
            <tr>
                <td class="footer-text">Tangerang, {{ $now->format('d-m-Y') }}</td>
                <td></td>
                <td></td>
            </tr>
            <tr>
                <td class="footer-text" style="font-weight: bold;">Dokter Pemeriksa</td>
                <td></td>
                <td></td>
            </tr>
            <tr>
                <td class="signature-spacing"></td>
                <td></td>
                <td></td>
            </tr>
            <tr>
                <td>
                    <div class="signature-line"></div>
                </td>
                <td></td>
                <td></td>
            </tr>
            <tr>
                <td class="footer-text">{{ $dokter_pengirim ?? (auth()->user()->name ?? 'Petugas') }}</td>
                <td></td>
                <td></td>
            </tr>
        </table>
    </div>

    @if($auto_print ?? false)
    <script>
        // Auto print saat halaman selesai load
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500); // Delay 500ms untuk memastikan halaman selesai render
        };
    </script>
    @endif
</body>

</html>