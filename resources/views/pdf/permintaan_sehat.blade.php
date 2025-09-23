<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Surat Sehat</title>
    <style>
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
            margin: 20px auto 0;
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
    <!-- Header Klinik -->
    <table style="width: 100%; margin-bottom: 10px;">
        <tr>
            <td style="width: 60px; text-align: center; vertical-align: middle;">
                <img src="{{ public_path('profile/default.png') }}" alt="Logo"
                    style="width: 50px; height: 50px; border-radius: 50%;">
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
    <div class="document-title">SURAT SEHAT</div>

    <!-- Keterangan Pasien -->
    <p class="teks">Yang bertanda tangan dibawah ini, menerangkan bahwa :</p>
    <table class="info-table">
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

    <!-- Pemeriksaan -->
    <p class="teks">
        Berdasarkan pemeriksaan yang telah dilakukan pada
        {{ $tgl_periksa ? \Carbon\Carbon::parse($tgl_periksa)->format('d-m-Y H:i') : '-' }},
        yang bersangkutan dinyatakan<b>&nbsp;SEHAT&nbsp;</b>dengan hasil pemeriksaan sebagai berikut :
    </p>
    <table class="info-table">
        <tr>
            <td class="info-label">Tekanan Darah</td>
            <td class="info-separator">:</td>
            <td>{{ $sistole ?? '-' }}/{{ $diastole ?? '-' }} mmHg</td>
        </tr>
        <tr>
            <td class="info-label">Nadi</td>
            <td class="info-separator">:</td>
            <td>{{ $nadi ?? '-' }} /menit</td>
        </tr>
        <tr>
            <td class="info-label">Suhu</td>
            <td class="info-separator">:</td>
            <td>{{ $suhu ?? '-' }} °C</td>
        </tr>
        <tr>
            <td class="info-label">Berat Badan</td>
            <td class="info-separator">:</td>
            <td>{{ $berat ?? '-' }} kg</td>
        </tr>
        <tr>
            <td class="info-label">Tinggi Badan</td>
            <td class="info-separator">:</td>
            <td>{{ $tinggi ?? '-' }} cm</td>
        </tr>
        <tr>
            <td class="info-label">Pernafasan</td>
            <td class="info-separator">:</td>
            <td>{{ $respiratory_rate ?? '-' }} /menit</td>
        </tr>
        <tr>
            <td class="info-label">Buta Warna</td>
            <td class="info-separator">:</td>
            <td>{{ $buta_warna_status ?? 'Tidak' }}</td>
        </tr>
    </table>

    <!-- Penutup -->
    <p class="teks">
        Demikian surat sehat ini dibuat dengan sebenar-benarnya dan untuk dipergunakan sebagaimana mestinya.
    </p>

    <!-- Footer / Tanda Tangan -->
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
                <td class="footer-text">
                    {{ $dokter_pengirim ?? (auth()->user()->name ?? 'Petugas') }}
                </td>
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