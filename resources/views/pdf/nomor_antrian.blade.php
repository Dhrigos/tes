<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nomor Antrian</title>
    <style>
        html, body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 11px; color: #000; }
        .wrap { width: 100%; padding: 6px 8px; box-sizing: border-box; }
        .title { text-align: center; font-weight: bold; font-size: 12px; margin-bottom: 6px; }
        .sep { border-bottom: 1px solid #000; margin: 6px 0; }
        .antrian { text-align: center; font-size: 28px; font-weight: bold; margin: 6px 0 8px; }
        .row { display: flex; justify-content: space-between; margin: 3px 0; }
        .label { width: 40%; color: #333; }
        .value { width: 58%; text-align: right; font-weight: bold; }
        .foot { text-align: center; margin-top: 8px; font-size: 10px; }
    </style>
    </head>
<body>
    <div class="wrap">
        <div class="title">{{ web_setting('nama_klinik') }}</div>
        <div class="sep"></div>

        <div class="antrian">{{ $nomor_antrian }}</div>

        <div class="row"><div class="label">No RM</div><div class="value">{{ $no_rm }}</div></div>
        <div class="row"><div class="label">Tanggal Daftar</div><div class="value">{{ $tanggal_daftar }}</div></div>
        <div class="row"><div class="label">Poli</div><div class="value">{{ $poli ?? '-' }}</div></div>
        <div class="row"><div class="label">Dokter</div><div class="value">{{ $dokter ?? '-' }}</div></div>

        <div class="sep"></div>
        <div class="foot">Terima kasih, harap menunggu panggilan.</div>
    </div>
</body>
</html>


