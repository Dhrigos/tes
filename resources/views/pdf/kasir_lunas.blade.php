<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Laporan Faktur Lunas Kasir</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.2;
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

        .logo-container {
            text-align: center;
            margin-right: 10px;
        }

        .logo {
            width: 50px;
            height: 50px;
            border-radius: 50%;
        }

        .header-text {
            text-align: center;
        }

        .header-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 2px;
        }

        .header-address {
            font-size: 12px;
            margin-bottom: 2px;
        }

        .divider {
            border-top: 1px solid #000;
            margin: 5px 0;
        }

        .document-title {
            font-size: 14px;
            font-weight: bold;
            margin: 8px 0;
        }

        .info-table {
            width: 100%;
            margin-bottom: 5px;
        }

        .info-table td {
            padding: 1px 0;
            vertical-align: top;
            border: none;
        }

        .info-label {
            width: 120px;
        }

        .info-separator {
            width: 10px;
            text-align: center;
        }

        table.items {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }

        table.items th,
        table.items td {
            border: 1px solid #000;
            padding: 2px;
            font-size: 10px;
            height: 26px;
        }

        table.items th {
            text-align: center;
            background-color: #f2f2f2;
        }

        table.items td {
            text-align: left;
        }

        .summary-table {
            width: 300px;
            margin-left: 0;
            margin-right: auto;
            border-collapse: collapse;
        }

        .summary-table td {
            padding: 3px 0;
            vertical-align: top;
            border: none;
        }

        .footer {
            position: fixed;
            bottom: 5px;
            width: 100%;
        }

        .signature-table {
            width: 175%;
            text-align: center;
        }

        .signature-line {
            border-top: 1px solid #000;
            width: 120px;
            margin: 0 auto;
            margin-top: 40px;
        }
    </style>
</head>

<body>
    <div class="header">
        <div class="logo-container">
            <img src="{{ public_path('profile/default.png') }}" alt="Klinik Logo" class="logo" style="width: 80px; height: 80px; opacity: .8">
        </div>
        <div class="header-text">
            <div class="header-title">{{ $namaKlinik }}</div>
            <div class="header-address">{!! nl2br(e($alamatKlinik)) !!}</div>
        </div>
    </div>

    <div class="divider"></div>

    <div class="document-title">LAPORAN FAKTUR LUNAS KASIR</div>

    <table class="info-table" style="width: 100%;">
        <tr>
            <td class="info-label">Dicetak pada</td>
            <td class="info-separator">:</td>
            <td>{{ \Carbon\Carbon::now()->format('d/m/Y H:i') }}</td>
            <td class="info-label">Poli</td>
            <td class="info-separator">:</td>
            <td>{{ $poli ?? 'Semua Poli' }}</td>
        </tr>
        <tr>
            <td class="info-label">Laporan Oleh</td>
            <td class="info-separator">:</td>
            <td>[{{ auth()->user()->name ?? 'Petugas' }}]</td>
            <td class="info-label">Periode</td>
            <td class="info-separator">:</td>
            <td>{{ $tanggal_awal }} s/d {{ $tanggal_akhir }}</td>
        </tr>
    </table>

    <div class="content-wrapper">
        <table class="items">
            <thead>
                <tr>
                    <th>No</th>
                    <th>Invoice</th>
                    <th>No RM</th>
                    <th>No Rawat</th>
                    <th>Nama</th>
                    <th>Poli</th>
                    <th>Dokter</th>
                    <th>Penjamin</th>
                    <th>Sub Total</th>
                    <th>Tambahan</th>
                    <th>Total</th>
                    <th>Pembayaran</th>
                    <th>Tanggal</th>
                    <th>Petugas Entry</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($data as $i => $row)
                <tr>
                    <td>{{ $row['no'] ?? ($i + 1) }}</td>
                    <td>{{ $row['kode_faktur'] ?? '-' }}</td>
                    <td>{{ $row['no_rm'] ?? '-' }}</td>
                    <td>{{ $row['no_rawat'] ?? '-' }}</td>
                    <td>{{ $row['nama'] ?? '-' }}</td>
                    <td>{{ $row['poli'] ?? '-' }}</td>
                    <td>{{ $row['dokter'] ?? '-' }}</td>
                    <td>{{ $row['penjamin'] ?? '-' }}</td>
                    <td style="text-align: right;">{{ $row['sub_total'] ?? '-' }}</td>
                    <td>
                        @php
                        $extras = [];
                        if (!empty($row['potongan_harga']) && $row['potongan_harga'] != 0) { $extras[] = 'Diskon: ' . $row['potongan_harga']; }
                        if (!empty($row['administrasi']) && $row['administrasi'] != 0) { $extras[] = 'Administrasi: ' . $row['administrasi']; }
                        if (!empty($row['materai']) && $row['materai'] != 0) { $extras[] = 'Materai: ' . $row['materai']; }
                        echo $extras ? implode("<br>", $extras) : '-';
                        @endphp
                    </td>
                    <td style="text-align: right;">{{ $row['total'] ?? '-' }}</td>
                    <td>
                        @php
                        $payments = [];
                        for ($j = 1; $j <= 3; $j++) {
                            $method=$row['payment_method_' . $j] ?? null;
                            $nominal=$row['payment_nominal_' . $j] ?? null;
                            if ($method && $nominal) {
                            $label=ucfirst((string) $method);
                            $payments[]=$label . ': ' . $nominal;
                            }
                            }
                            echo $payments ? implode('<br>', $payments) : '-';
                            @endphp
                    </td>
                    <td>{{ isset($row['tanggal']) ? explode('T', $row['tanggal'])[0] : '-' }}</td>
                    <td>{{ $row['user_input_name'] ?? '-' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="clearfix">
            <table class="summary-table">
                <tr>
                    <td>Jumlah Invoice</td>
                    <td>:</n>
                    <td style="text-align: right;">{{ $total_invoice }} Data</td>
                </tr>
            </table>
        </div>
    </div>

    <div class="footer">
        <table class="signature-table">
            <tr>
                <td></td>
                <td></td>
                <td>Paraf Petugas</td>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td style="height: 40px;"></td>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td>
                    <div class="signature-line"></div>
                </td>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td>{{ auth()->user()->name ?? 'Petugas' }}</td>
            </tr>
        </table>
    </div>

</body>

</html>