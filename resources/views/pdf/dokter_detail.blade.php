<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Detail Pelayanan Dokter</title>
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
    $item = $item ?? null; // associative array
    $soap = $item['soap_dokter'] ?? ($item['soap'] ?? []);
    $pasien = $item['pasien'] ?? [];
    $poli = $item['poli'] ?? [];
    $penjamin = $item['penjamin'] ?? [];
    $tanggal = $item['tanggal_kujungan'] ?? ($item['created_at'] ?? '');
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
                <td class="muted">Dokter</td>
                <td colspan="3">: {{ $item['dokter_nama'] ?? '-' }}</td>
            </tr>
        </table>
    </div>

    <table class="grid">
        <tr>
            <td style="width: 50%;">
                <div class="section">
                    <div class="section-title">Subjective (Anamnesa)</div>
                    <div class="mono">{{ $soap['anamnesa'] ?? '-' }}</div>
                </div>
                <div class="section">
                    <div class="section-title">Objective - Tanda Vital</div>
                    <table class="kv">
                        <tr>
                            <td class="key">Tensi</td>
                            <td>{{ $soap['tensi'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">Sistol</td>
                            <td>{{ $soap['sistol'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">Distol</td>
                            <td>{{ $soap['distol'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">Suhu</td>
                            <td>{{ $soap['suhu'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">Nadi</td>
                            <td>{{ $soap['nadi'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">RR</td>
                            <td>{{ $soap['rr'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">SpO2</td>
                            <td>{{ $soap['spo2'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">Tinggi</td>
                            <td>{{ $soap['tinggi'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">Berat</td>
                            <td>{{ $soap['berat'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">Lingkar Perut</td>
                            <td>{{ $soap['lingkar_perut'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">BMI</td>
                            <td>{{ $soap['nilai_bmi'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">Status BMI</td>
                            <td>{{ $soap['status_bmi'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">Kesadaran</td>
                            <td>{{ $soap['kesadaran'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">GCS Eye</td>
                            <td>{{ $soap['eye'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">GCS Verbal</td>
                            <td>{{ $soap['verbal'] ?? '-' }}</td>
                        </tr>
                        <tr>
                            <td class="key">GCS Motorik</td>
                            <td>{{ $soap['motorik'] ?? '-' }}</td>
                        </tr>
                    </table>
                </div>
            </td>
            <td style="width: 50%;">
                <div class="section">
                    <div class="section-title">HTT / Temuan Objektif</div>
                    <div class="mono">{{ $soap['htt'] ?? '-' }}</div>
                </div>
                <div class="section">
                    <div class="section-title">Assessment</div>
                    <div class="mono">{{ $soap['assesmen'] ?? '-' }}</div>
                </div>
                <div class="section">
                    <div class="section-title">Expertise</div>
                    <div class="mono">{{ $soap['expertise'] ?? '-' }}</div>
                </div>
                <div class="section">
                    <div class="section-title">Evaluasi</div>
                    <div class="mono">{{ $soap['evaluasi'] ?? '-' }}</div>
                </div>
                <div class="section">
                    <div class="section-title">Plan</div>
                    <div class="mono">{{ $soap['plan'] ?? '-' }}</div>
                </div>
            </td>
        </tr>
    </table>

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