<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Kasir Bill</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 9px;
            /* Lebih kecil */
            line-height: 1.2;
            /* Lebih rapat */
            margin: 10px;
            /* Margin lebih kecil */
            padding: 0;
        }

        .header-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 2px;
            width: 50%;
        }

        .header-address,
        .header-phone {
            font-size: 9px;
            margin-bottom: 2px;
            width: 50%;
        }

        .divider {
            border-top: 1px solid #000;
            margin: 5px 0;
        }

        .document-title {
            font-size: 12px;
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
            width: 70px;
        }

        .info-separator {
            width: 10px;
            text-align: center;
        }

        .header-label {
            width: 10%;
        }

        .header-separator {
            width: 5%;
            text-align: center;
        }

        .header-content {
            width: 15%;
        }

        table.items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
            /* margin-top: 8px; */
        }

        table.items th {
            border: 1px solid #000;
            padding: 2px;
            text-align: center;
            height: 15px;
        }

        table.items td {
            border: 1px solid #000;
            padding: 2px;
            height: 15px;
        }

        table.items th {
            background-color: #f2f2f2;
            height: 15px;
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

        .total-row td {
            font-weight: bold;
            padding-top: 3px;
        }

        .summary-divider {
            border-top: 1px solid #000;
            margin: 5px 0;
            width: 100%;
        }

        .footer {
            position: fixed;
            bottom: 5px;
            width: 100%;
            text-align: center;
        }

        .signature-table {
            width: 100%;
            text-align: center;
        }

        .signature-line {
            border-top: 1px solid #000;
            width: 80%;
            margin: 0 auto;
            margin-top: 40px;
            /* Lebih kecil */
        }

        .page-break {
            page-break-after: always;
        }

        .content-wrapper {
            min-height: auto;
            /* Hapus fixed height */
        }

        .footnote {
            font-size: 8px;
            font-style: italic;
            margin-top: 3px;
            margin-bottom: 8px;
            text-align: right;
            font-weight: bold;
        }

        .total-divider {
            border-top: 1px solid #000;
            width: 100%;
            margin: 2px 0;
        }
    </style>
</head>

<body>
    <table class="info-table" style="width: 100%;">
        <tr>
            <td class="header-title">{{ $namaKlinik }}</td>

            <td class="header-label">No. Invoice</td>
            <td class="header-separator">:</td>
            <td class="header-content">{{ $kasir->kode_faktur }}</td>
        </tr>
        <tr>
            {{-- <td class="header-address" rowspan="3">Ruko Danau Citra, Jl. Citra Raya Boulevard No.10, Kec. Cikupa,</td> --}}
            <td class="header-address" rowspan="3">{!! nl2br(e($alamatKlinik)) !!}</td>

            <td class="header-label">No. Pendaftaran</td>
            <td class="header-separator">:</td>
            <td class="header-content">{{ $kasir->no_rawat ?? '-' }}</td>

        </tr>
        <tr>
            {{-- <td class="header-address">Kabupaten Tangerang, Banten 15131</td> --}}

            <td class="header-label">No. pasien</td>
            <td class="header-separator">:</td>
            <td class="header-content">{{ $kasir->no_rm }}</td>
        </tr>

        <tr>
            {{-- <td class="header-phone">0813-1089-4294</td> --}}

            <td class="header-label">Tanggal</td>
            <td class="header-separator">:</td>
            {{-- <td class="header-content">{{ $kasir->tanggal }}</td> --}}
            <td class="header-content">{{ now()->format('Y-m-d H:i') }}</td>
        </tr>
    </table>

    <div class="divider"></div>

    <div class="document-title">Invoice Pembayaran Pasien</div>

    <table class="info-table" style="width: 100%;">
        <tr>
            <td class="info-label">Nama</td>
            <td class="info-separator">:</td>
            <td>{{ $kasir->nama }}</td>

            <td class="info-label">Poli</td>
            <td class="info-separator">:</td>
            <td>{{ $kasir->poli }}</td>
        </tr>

        <tr>
            <td class="info-label">Jenis Kelamin</td>
            <td class="info-separator">:</td>
            <td>{{ $kasir->sex ?? '-'}}</td>

            <td class="info-label">Dokter</td>
            <td class="info-separator">:</td>
            <td>{{ $kasir->dokter ?? '-' }}</td>
        </tr>

        <tr>
            <td class="info-label">Penjamin</td>
            <td class="info-separator">:</td>
            <td>{{ $kasir->penjamin }}</td>

            <td class="info-label">Perawatan</td>
            <td class="info-separator">:</td>
            <td>{{ $kasir->jenis_perawatan }}</td>
        </tr>

        <tr>
            <td class="info-label" style="height: 20px; vertical-align: middle;">Alamat</td>
            <td class="info-separator" style="height: 20px; vertical-align: middle;">:</td>
            <td colspan="3" style="height: 20px; vertical-align: middle;">{{ $kasir->alamat ?? '-' }}</td>
        </tr>
    </table>

    <div class="content-wrapper">
        <table class="items">
            <thead>
                <tr>
                    <th style="width: 45%">Nama Tindakan / Obat</th>
                    <th style="width: 20%">Harga Tindakan / Obat</th>
                    <th style="width: 15%">Qty / Pelaksana</th>
                    <th style="width: 20%">Sub Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($kasir->detail_lunas as $item)
                <tr>
                    <td>{{ $item->nama_obat_tindakan }}</td>
                    <td style="text-align: center;">{{ $item->harga_obat_tindakan }}</td>
                    <td style="text-align: center;">{{ $item->qty_pelaksana }}</td>
                    <td style="text-align: center;">{{ $item->total }}</td>
                </tr>
                @endforeach
                @if($kasir->administrasi != 0)
                <tr>
                    <td>Administrasi</td>
                    <td style="text-align: center;">{{ $kasir->administrasi }}</td>
                    <td style="text-align: center;">1</td>
                    <td style="text-align: center;">{{ $kasir->administrasi }}</td>
                </tr>
                @endif

                @php
                $materai = $kasir->materai;
                $qty = 1;

                if (in_array($materai, [6000, 3000, 10000])) {
                $qty = 1;
                } elseif ($materai % 6000 === 0) {
                $qty = $materai / 6000;
                } elseif ($materai % 10000 === 0) {
                $qty = $materai / 10000;
                }
                @endphp

                @if($kasir->materai != 0)
                <tr>
                    <td>Materai</td>
                    <td style="text-align: center;">{{ number_format($materai / $qty, 0, ',', '.') }}</td>
                    <td style="text-align: center;">{{ $qty }}</td>
                    <td style="text-align: center;">{{ number_format($materai, 0, ',', '.') }}</td>
                </tr>
                @endif
                <tr>
                    <th style="text-align: center;" colspan="3">TOTAL</th>
                    <td style="text-align: center;">{{ $kasir->total }}</td>
                </tr>
            </tbody>
        </table>
        <!-- Catatan kaki untuk menjelaskan subtotal - Diperbaiki dengan font yang lebih jelas -->
        <div style="font-size: 8px; font-style: italic; margin-top: 3px; margin-bottom: 8px; text-align: right; font-weight: bold;">
            * Subtotal sudah termasuk diskon per item
        </div>
    </div>
</body>

</html>