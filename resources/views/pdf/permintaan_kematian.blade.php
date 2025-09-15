<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Surat Kematian</title>
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
            margin: 0 auto;
            margin-top: 20px;
        }

        .page-break {
            page-break-after: always;
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

    <div class="document-title">SURAT KEMATIAN</div>

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

    <p class="teks">Telah meninggal dunia pada
        {{ $tanggal_meninggal ? \Carbon\Carbon::parse($tanggal_meninggal)->format('d-m-Y') : '-' }}
        {{ $jam_meninggal ? 'Jam ' . $jam_meninggal : '' }} dengan keterangan sebagai berikut :
    </p>

    <table class="info-table" style="width: 100%;">
        <tr>
            <td class="info-label">Tanggal/Jam Meninggal</td>
            <td class="info-separator">:</td>
            <td>{{ $tanggal_meninggal ? \Carbon\Carbon::parse($tanggal_meninggal)->format('d-m-Y') : '-' }}
                {{ $jam_meninggal ? 'Jam ' . $jam_meninggal : '' }}
            </td>
        </tr>

        <tr>
            <td class="info-label">Penyebab Kematian</td>
            <td class="info-separator">:</td>
            <td>
                @if ($penyebab_kematian == 'Sakit')
                Sakit
                @elseif($penyebab_kematian == 'Lainnya')
                {{ $penyebab_lainnya ?? '-' }}
                @elseif($penyebab_kematian == 'DOA')
                DOA (Death on Arrival)
                @else
                {{ $penyebab_kematian ?? '-' }}
                @endif
            </td>
        </tr>

        <tr>
            <td class="info-label">Referensi</td>
            <td class="info-separator">:</td>
            <td>{{ $ref_tgl_jam ?? '-' }}</td>
        </tr>
    </table>

    <p class="teks">Demikian surat kematian ini dibuat dengan sebenar-benarnya dan untuk dipergunakan sebagai
        mestinya.</p>

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
</body>

</html>