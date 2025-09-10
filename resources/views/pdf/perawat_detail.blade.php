<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Detail Pelayanan Perawat</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.3;
            margin: 10px;
            padding: 0;
        }

        .header {
            text-align: center;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .logo {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            margin-right: 12px;
        }

        .header-title {
            font-size: 18px;
            font-weight: bold;
            margin: 0 0 2px 0;
        }

        .header-address {
            font-size: 12px;
            margin: 0;
        }

        .divider {
            border-top: 1px solid #000;
            margin: 8px 0;
        }

        .section {
            border: 1px solid #000;
            padding: 8px;
            margin-bottom: 8px;
        }

        .section-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 6px;
        }

        .info-table,
        .kv {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 2px 0;
            vertical-align: top;
            border: none;
        }

        .kv td {
            padding: 3px 4px;
            border: 1px solid #000;
            font-size: 11px;
        }

        .kv .key {
            width: 35%;
            background: #f5f5f5;
        }

        .grid {
            width: 100%;
            border-collapse: collapse;
        }

        .grid td {
            vertical-align: top;
            padding: 0 6px;
        }

        .muted {
            color: #555;
        }

        .mono {
            font-family: "Courier New", Courier, monospace;
            white-space: pre-wrap;
        }

        .signature-table {
            width: 100%;
            text-align: center;
            margin-top: 16px;
        }

        .signature-line {
            border-top: 1px solid #000;
            width: 140px;
            margin: 32px auto 4px;
        }
    </style>
    @php
    $item = $item ?? null; // expected associative array with patient, visit, and so_perawat
    $so = $item['so_perawat'] ?? ($item['soap_perawat'] ?? []);
    $pasien = $item['pasien'] ?? [];
    $poli = $item['poli'] ?? [];
    $penjamin = $item['penjamin'] ?? [];
    $tanggal = $item['tanggal_kujungan'] ?? ($item['tanggal'] ?? ($item['created_at'] ?? ''));
    $tgl = is_string($tanggal) ? (str_contains($tanggal, 'T') ? explode('T', $tanggal)[0] : substr($tanggal, 0, 10)) : '';
    $jam = is_string($tanggal) && str_contains($tanggal, 'T') ? (explode('T', $tanggal)[1] ?? '') : (is_string($tanggal) && str_contains($tanggal, ' ') ? (explode(' ', $tanggal)[1] ?? '') : '');
    @endphp
</head>

<body>
    <div class="header">
        <img src="{{ public_path('profile/default.png') }}" alt="Klinik Logo" class="logo">
        <div>
            <div class="header-title">{{ $namaKlinik ?? 'Klinik' }}</div>
            <div class="header-address">{!! nl2br(e($alamatKlinik ?? '')) !!}</div>
        </div>
    </div>

    <div class="divider"></div>
    <div class="section">
        <div class="section-title">Informasi Kunjungan</div>
        <table class="info-table">
            <tr>
                <td class="muted">No RM</td>
                <td>: {{ $item['nomor_rm'] ?? ($pasien['no_rm'] ?? '-') }}</td>
                <td class="muted">No Rawat</td>
                <td>: {{ $item['nomor_register'] ?? '-' }}</td>
            </tr>
            <tr>
                <td class="muted">Nama</td>
                <td>: {{ $pasien['nama'] ?? '-' }}</td>
                <td class="muted">JK</td>
                <td>: {{ $pasien['seks'] ?? '-' }}</td>
            </tr>
            <tr>
                <td class="muted">Tanggal</td>
                <td>: {{ $tgl ?: '-' }}</td>
                <td class="muted">Jam</td>
                <td>: {{ $jam ?: '-' }}</td>
            </tr>
            <tr>
                <td class="muted">Poli</td>
                <td>: {{ $poli['nama'] ?? '-' }}</td>
                <td class="muted">Penjamin</td>
                <td>: {{ $penjamin['nama'] ?? '-' }}</td>
            </tr>
            <tr>
                <td class="muted">Perawat</td>
                <td colspan="3">: {{ $so['user_input_name'] ?? ($item['perawat_nama'] ?? '-') }}</td>
            </tr>
        </table>
    </div>

    <table class="grid">
        <tr>
            <td style="width: 50%;">
                <div class="section">
                    <div class="section-title">Tanda Vital</div>
                    <table class="kv">
                        <tr>
                            <td class="key">Tensi</td>
                            <td>{{ $so['tensi'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">Sistol</td>
                            <td>{{ $so['sistol'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">Distol</td>
                            <td>{{ $so['distol'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">Suhu</td>
                            <td>{{ $so['suhu'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">Nadi</td>
                            <td>{{ $so['nadi'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">RR</td>
                            <td>{{ $so['rr'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">SpO2</td>
                            <td>{{ $so['spo2'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">Tinggi</td>
                            <td>{{ $so['tinggi'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">Berat</td>
                            <td>{{ $so['berat'] ?? '-' }}</td>
                        </tr>
                    </table>
                </div>
                <div class="section">
                    <div class="section-title">Alergi</div>
                    <table class="kv">
                        <tr>
                            <td class="key">Jenis Alergi</td>
                            <td>{{ $so['jenis_alergi'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">Alergi</td>
                            <td>{{ $so['alergi'] ?? '-' }}</td>
                        </tr>
                    </table>
                </div>
            </td>
            <td style="width: 50%;">
                <div class="section">
                    <div class="section-title">Kesadaran & GCS</div>
                    <table class="kv">
                        <tr>
                            <td class="key">Kesadaran</td>
                            <td>{{ $so['kesadaran'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">GCS Eye</td>
                            <td>{{ $so['eye'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">GCS Verbal</td>
                            <td>{{ $so['verbal'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">GCS Motorik</td>
                            <td>{{ $so['motorik'] ?? '-' }}</td>
                        </tr>
                    </table>
                </div>
                <div class="section">
                    <div class="section-title">HTT / Tindakan</div>
                    <div class="mono">{{ $so['htt'] ?? '-' }}</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="section">
        <div class="section-title">Catatan</div>
        <div class="mono">{{ $so['catatan'] ?? '-' }}</div>
    </div>

    <table class="signature-table">
        <tr>
            <td></td>
            <td style="width: 200px;">
                <div class="signature-line"></div>
                <div>{{ auth()->user()->name ?? 'Petugas' }}</div>
            </td>
        </tr>
    </table>

</body>

</html>