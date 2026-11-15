// Struk Margaluyu Farm sebagai gambar JPG. Susunannya sama dengan struk di layar (struk-pesanan.html).
(function () {
  'use strict';
  var W = 360, M = 16, PAD = 24, SCALE = 3, TEETH = 8;
  var PW = W - M * 2, L = M + PAD, R = W - M - PAD, INNER = R - L;
  var INK = '#1f2d28', MUTED = '#5b6962', LINE = '#b9b29d', BRAND = '#0a3d38', OK = '#1e6a3c', BG = '#f3f0e6';
  var SANS = 'Inter, Arial, Helvetica, sans-serif';
  var MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, "Courier New", monospace';
  function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
  function font(g, weight, size, family) { g.font = weight + ' ' + size + 'px ' + family; }
  function wrap(g, value, max) {
    var words = String(value == null || value === '' ? '-' : value).split(/\s+/), lines = [], line = '';
    words.forEach(function (word) { var next = line ? line + ' ' + word : word; if (g.measureText(next).width > max && line) { lines.push(line); line = word; } else line = next; });
    if (line) lines.push(line); return lines;
  }
  function dash(g, y) { g.strokeStyle = LINE; g.lineWidth = 1; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(L, y + .5); g.lineTo(R, y + .5); g.stroke(); g.setLineDash([]); }
  // Satu baris label-nilai; nilai panjang dipecah ke beberapa baris, rata kanan.
  function row(g, label, value, y, o) {
    o = o || {};
    font(g, 400, 13, SANS); g.fillStyle = MUTED; g.textAlign = 'left'; g.fillText(label, L, y);
    font(g, o.mono ? 500 : 500, o.mono ? 12.5 : 13, o.mono ? MONO : SANS); g.fillStyle = o.color || INK; g.textAlign = 'right';
    var room = INNER - g.measureText(label).width - 16, lines = wrap(g, value, Math.max(room, 90));
    lines.forEach(function (t, i) { g.fillText(t, R, y + i * 17); });
    return y + Math.max(lines.length, 1) * 17 + 3;
  }
  // Gambar seluruh struk. Bila `paintH` diberikan, latar dan kertas dilukis lebih dulu.
  function draw(g, d, logo, paintH) {
    var y;
    if (paintH) {
      g.fillStyle = BG; g.fillRect(0, 0, W, paintH);
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(M, M); g.lineTo(W - M, M); g.lineTo(W - M, paintH - M - TEETH);
      var n = Math.round(PW / 16), step = PW / n;
      for (var i = n; i > 0; i--) { g.lineTo(M + i * step - step / 2, paintH - M); g.lineTo(M + (i - 1) * step, paintH - M - TEETH); }
      g.closePath(); g.fill();
    }
    g.textAlign = 'center';
    y = M + 28;
    // Tanda logo di paling atas, lalu nama usaha (sesuai contoh struk dari pemilik).
    if (logo && logo.naturalWidth) { try { g.drawImage(logo, W / 2 - 26, y, 52, 52); } catch (_) {} }
    y += 52 + 19;
    font(g, 700, 21, SANS); g.fillStyle = BRAND; g.fillText('Margaluyu Farm', W / 2, y); y += 17;
    font(g, 400, 12, SANS); g.fillStyle = MUTED; g.fillText('Susu kambing Saanen segar \u00b7 Surabaya', W / 2, y); y += 17;
    dash(g, y); y += 20;

    font(g, 400, 12, SANS); g.fillStyle = MUTED; g.fillText(d.pending ? 'Nomor sementara' : 'Nomor pesanan', W / 2, y); y += 22;
    font(g, 600, 19, MONO); g.fillStyle = INK;
    var idLines = wrap(g, d.id || '-', INNER); idLines.forEach(function (t) { g.fillText(t, W / 2, y); y += 24; });
    y -= 2;
    font(g, 400, 12.5, SANS); g.fillStyle = MUTED;
    var meta = String(d.tanggal || '-') + '  ·  ' + String(d.status || 'Dikonfirmasi');
    var mw = g.measureText(meta).width; g.fillText(meta, W / 2 + 7, y);
    g.fillStyle = /menunggu|diproses/i.test(d.status || '') ? '#c28a0e' : OK; g.beginPath(); g.arc(W / 2 + 7 - mw / 2 - 10, y - 4, 4, 0, Math.PI * 2); g.fill();
    y += 14; dash(g, y); y += 22;

    y = row(g, 'Pelanggan', d.nama || '-', y);
    if (d.jadwal) y = row(g, 'Jadwal kirim', d.jadwal, y);
    y += 6; dash(g, y); y += 22;

    font(g, 600, 14.5, SANS); g.fillStyle = INK; g.textAlign = 'left';
    wrap(g, d.produk || '-', INNER).forEach(function (t) { g.fillText(t, L, y); y += 19; });
    y += 1;
    font(g, 400, 12.5, MONO); g.fillStyle = MUTED; g.fillText((d.qty || 1) + ' x ' + rupiah(d.unit), L, y);
    g.fillStyle = INK; g.textAlign = 'right'; g.fillText(rupiah(d.subtotal != null ? d.subtotal : Number(d.unit || 0) * Number(d.qty || 1)), R, y);
    y += 14; dash(g, y); y += 22;

    y = row(g, 'Subtotal', rupiah(d.subtotal != null ? d.subtotal : Number(d.unit || 0) * Number(d.qty || 1)), y, { mono: true });
    y = row(g, 'Ongkos kirim', Number(d.shipping || 0) === 0 ? 'Gratis' : rupiah(d.shipping), y, { mono: true });
    if (Number(d.discount || 0) > 0) y = row(g, 'Diskon', '- ' + rupiah(d.discount), y, { mono: true, color: OK });
    y += 6; dash(g, y); y += 30;

    font(g, 600, 16, SANS); g.fillStyle = INK; g.textAlign = 'left'; g.fillText('Total bayar', L, y);
    font(g, 700, 24, MONO); g.fillStyle = BRAND; g.textAlign = 'right'; g.fillText(rupiah(d.total), R, y);
    y += 16; dash(g, y); y += 24;

    y = row(g, 'Pembayaran', d.bayar || '-', y);
    y = row(g, 'Status bayar', d.paymentStatus || '-', y);
    y += 8;
    g.textAlign = 'center';
    font(g, 600, 13.5, SANS); g.fillStyle = INK; g.fillText('Terima kasih telah memesan', W / 2, y + 12); y += 30;
    font(g, 400, 12, SANS); g.fillStyle = MUTED; g.fillText('Simpan struk ini sebagai bukti pemesanan.', W / 2, y); y += 14;
    return y + 18 + TEETH + M;
  }
  // Cara menyimpan struk:
  //  - desktop: unduh langsung.
  //  - HP / browser dalam aplikasi: tampilkan jendela "Struk siap" dengan tombol Simpan (klik baru dari pengguna,
  //    jadi tidak diblokir), tombol Bagikan bila didukung, dan petunjuk tekan-lama sebagai cadangan terakhir.
  function saveBlob(blob, name) {
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function deliver(blob, name) {
    var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var inApp = /FBAN|FBAV|Instagram|Line\/|MicroMessenger|; wv\)|WhatsApp|TikTok|musical_ly/i.test(navigator.userAgent);
    if (coarse || inApp) return sheet(blob, name, inApp);
    saveBlob(blob, name);
    return Promise.resolve();
  }
  function sheet(blob, name, inApp) {
    if (!document.getElementById('mfr-style')) {
      var st = document.createElement('style'); st.id = 'mfr-style';
      st.textContent = '.mfr{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,30,27,.7);font:400 15px/1.5 Inter,Arial,sans-serif;animation:mfr-in .2s ease-out}'
        + '.mfr-card{width:100%;max-width:440px;max-height:94vh;overflow:auto;background:#fbf8ef;border-radius:16px 16px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom));color:#1f2d28;animation:mfr-up .28s cubic-bezier(.2,.8,.2,1)}'
        + '.mfr h2{margin:0 0 4px;font:700 19px/1.2 Inter,Arial,sans-serif;color:#0a3d38}.mfr p{margin:0 0 14px;color:#5b6962;font-size:14px}'
        + '.mfr img{display:block;width:62%;max-width:240px;margin:0 auto 16px;border-radius:6px;box-shadow:0 6px 20px rgba(0,0,0,.18)}'
        + '.mfr button{display:block;width:100%;height:48px;margin-top:10px;border-radius:8px;font:600 15.5px Inter,Arial,sans-serif;cursor:pointer}'
        + '.mfr .p{border:0;background:#0a3d38;color:#fff}.mfr .s{border:1.5px solid #0a3d38;background:transparent;color:#0a3d38}.mfr .c{border:0;background:transparent;color:#5b6962;height:40px}'
        + '@keyframes mfr-in{from{opacity:0}}@keyframes mfr-up{from{transform:translateY(40px);opacity:0}}@media(prefers-reduced-motion:reduce){.mfr,.mfr-card{animation:none}}';
      document.head.appendChild(st);
    }
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(blob), box = document.createElement('div'), card = document.createElement('div');
      box.className = 'mfr'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Struk siap disimpan');
      card.className = 'mfr-card';
      card.innerHTML = '<h2>Struk siap</h2><p>' + (inApp ? 'Tekan lama gambar, lalu pilih \u201cSimpan gambar\u201d. Atau buka halaman ini di Chrome/Safari agar tombol Simpan bekerja.' : 'Ketuk Simpan gambar. Bila tidak muncul, tekan lama gambar lalu pilih \u201cSimpan gambar\u201d.') + '</p>';
      var img = document.createElement('img'); img.src = url; img.alt = 'Pratinjau struk pesanan'; card.appendChild(img);
      function btn(cls, text, fn) { var b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = text; b.onclick = fn; card.appendChild(b); return b; }
      var file; try { file = new File([blob], name, { type: 'image/jpeg' }); } catch (_) { file = null; }
      var first = btn('p', 'Simpan gambar', function () { saveBlob(blob, name); });
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        btn('s', 'Bagikan atau simpan ke Galeri', function () { navigator.share({ files: [file], title: 'Struk Margaluyu Farm' }).catch(function () {}); });
      }
      function close() { box.remove(); URL.revokeObjectURL(url); document.removeEventListener('keydown', esc); resolve(); }
      function esc(e) { if (e.key === 'Escape') close(); }
      btn('c', 'Tutup', close);
      box.addEventListener('click', function (e) { if (e.target === box) close(); });
      document.addEventListener('keydown', esc);
      box.appendChild(card); document.body.appendChild(box); first.focus();
    });
  }
  // Membuat struk: kanvas (untuk pratinjau di layar) + Blob JPG (untuk unduhan) dari gambar yang SAMA.
  // Bila gagal, dicoba lagi tanpa logo dan dengan resolusi lebih rendah sebelum menyerah.
  function paint(d, mark, scale) {
    return new Promise(function (resolve, reject) {
      try {
        var measure = document.createElement('canvas').getContext('2d');
        var height = Math.ceil(draw(measure, d, mark, 0));
        var canvas = document.createElement('canvas'); canvas.width = W * scale; canvas.height = height * scale;
        var ctx = canvas.getContext('2d'); ctx.scale(scale, scale); draw(ctx, d, mark, height);
        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('toBlob kosong (kanvas terlalu besar atau diblokir browser)')); return; }
          resolve({ blob: blob, canvas: canvas, width: W, height: height, name: 'struk-' + String(d.id || 'pesanan').replace(/[^a-z0-9-]/gi, '') + '.jpg' });
        }, 'image/jpeg', 0.96);
      } catch (e) { reject(e); }
    });
  }
  // Logo tertanam di berkas ini agar SELALU muncul di semua struk (tidak bergantung jaringan, cache, atau CSP).
  var LOGO_DATA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAYAAACLz2ctAAAen0lEQVR4nO2deZhcZZ3vP7/3nFp6qarupElkkeDIsKjoMKCAwG2UHQMu8/QsDzo6eh19XHgcL85cvfM8Tbi4L4/jdpHRGRnxKoRBGRKyEAiNgAQmgxhuEAFZZMvS6e6q6u5aznl/949zTlV3yNLprdZPHpJQVV1569T3/N739/6WF9osJlLrAbRp0xZhmwXDsD+BHUuCE1ga/l9bhCGm1gNoIgSwgE57dDAU5ZGdJ3JC5i4u6D4hfE372tO+CPNDIDLl3PhxvC25Inx0qpVTMu5FxM0b6HK+zgqS6F5CbVHaApw7wlUo/fSQSd5IZ+zdAAyElu8qlLPoxTUDKM/imtN5Q+oCBGUAp7ZDrz1tAc4NYQCDoPSkv45xTsAxpwBwE7byXG/6coz8EZYCAAnn4loOup5waz2AhmYAw2p8Lst8mph5J8LLuHIcb6IHYRSwnJ5eQsx8CCEPuChlLK8CYDWWYKpu2em4bQFny2Aovgu7ziEmVwKjgCK6nL7O1xAJ6zD9NI45BtUJRAXBIPhAJLuWFR+0BTg7BjGswnJa13I63K9iQkGBBUkSiy0BlIu6zyLufAh0NyIxVBSrDspzAPx5+/o35xQ8dXG/M/RGl02xNK9DWYUyO+sjbEcAw6ucLxKTFSijCC5gEQTHL3EKMTqdryKi2Ogn1SBYCt4tlXG0OM0pwNUVi3RgFKlYodX72MPbF9G67x2p9xNzLkPZAxXBC4qS8zyOTn8Rx5yAsgshhuCh0ovn/5z1+XsrVnQ6EnrP0edQeMVrmopm2pGPFvMuA71X4dmjcaSAg4+KT9F/kaI+R4d5EbydPDT+FM8zOe0dIsu5PzFGojk3dRwZZy0iLoKPTBGNonj+MzjmeIQCIiZ81KBq2TF5PvcWf0+w/KmKawBnxjdOE9F8FvBYOvH1L4iZV6EUsQiK4DpKDIvgYN08p/W8xFt4Hl+34LOVPWMPsppc5X0CQUy1QNHN6tDNNTiSQRkFHCzV1bQgxMzxqBSm/IzFkKGsa7i3+PspYpOKRV2Nz7EkOKnnQnxORrRAgRvZMPZs+B5NOV03nwAtAroHa1xEy0AgAwn/pijGOKBHorICh/OAIof3vMB79H482cDLo3ezmiwQWT0YQFiFz0Wp9+O65wLD4brvlfOISmGaVYyQ8JU3hdsvglaE+K6eyzF8DCMn4KIgGax/PPDBcAxNKcDmm4IPp5O39tyDyHKguE8hBGgYDgscB0scQzcAVp+ibNdQ1p+xLve78NXCOR1H0htfh+tkQMsVQc0Ui0OhfCVr87cAPm8hzZLO0+l0P4Zx+xGdQBlHUQQH3xZ5oXQhD06+QDXW3FQ0kwAh+jzv7lmLy8mojB9AgNNRtYgoqgp0gHSjMobvr2Xc+z/cMf4ol6W+R9wdAEYq1u9QUDGoTaBsx9oRHPNalCMRsQhZFIMJx2vxQZdQ8L/A2tzXm3WN2FwCjL6kyzJXEzefRHUXRmYhFDTYLFYXlR5ghKJ/L3FzNiLB1Dk7NHzvTsABLaJSCl0Uh2CdJ9UxaAyP3bxkz+OB7EjlPZqI5twInfA3gpZAZneDBVOrixVQdqMYks5FGGEO4ove2aBMAFmQMoIJxRc8P20MUsThGJbajwI6bYumSWguCwjBWu1UXI7OrCFm3ohl5tPwK99Lo7+gWIwsdvZKkDdorWHEu5S7xn+zn/3DhqXp7ij+HMNWykzYb+FrHJnhBvO+kOiXSA3EF4wAPMQkSMe+wgqSUx5vCppPgKvxGcSwIbeWkv/vwFKsllFtzC/N4iCSJSZv5qSeL7IqTPNqEhE2xYfYB8FK7VSWcnTmP3DltUG8VmK1HtisCJYCPmgfBf8a1uS+ETpcs7fudULzWcAA5SqErexm1P4NHi+i9IKWGi4VPpCYIDiIDJNw/heXdP1daOklLAdoWJrVAgZEC/b+xDEsiV+L656OMgJaBjGzdk5qhVYyeDIU/G+yJvt5oKHjyM0tQKh+OReRIJn+nxjzPkR6ES0gUghf1RjXQcNfQRpDL55/Gy/7/8CW8R0VS9hgHnJjXPi5U808OTd1HN3mcgzn4MgfI9j9xm7rEYsiCoiHsATfPk1RrmHt6H8AgdXfjjTK+rBVBAggDCJTLITLhZmj8L0zSMU+TUyWoXg01jXxQZOoxCn76/D5LmuyD1WejdLL5paAu6A00sWeOwM44Zdh6T+sm97i+3DM5Rg5CsKslEajmm+dwmoZ9E6K+n/JZ+9jiPy01w5iuBvDOdh6maob74LPjqnWz+HSnvcS4+MYjkckB5RqPcA5Y9UP49RprFqU3+PbX4H8kkn/twznn2Ir5crrFeGqaTNCTWh+AU71EFemziBm/hHHnIHoOMgkQTp9M10HP9y2SaIkAYPqHgzDlPh/GB5m0ruT9fntQM096Ga68HtTtXrnppbS7XwOV/8KMQYlG6Y9NYbjMRuCrBsb/uliiSMkABc0j9WtFL1vsnb87lrGl5tTgFMv6MrUpcSdq3DkGCwjBJOPOeRk0kYm2j8UFBuWJQgpFIey/SK3jn19Stb1ojoqzfclRFPKW0nR13M1CXkfMBkUhjdoKG4+0XCCVvXCR46kqFdw29gPa2EJm0mA1Sn3nI7TWBL/Gsa8HmE4vOTNO93OFsWCuKhfZHe5n6GJl1nkViHN8aVE7dFWYVmZ/gh9iZtx5LUow4DTFt9+EdAiYpbR4/YDLHbSa+NXxUXTxgqSnJz+MjHnr0FGUDtJM3y+hSJKylCVoBZG0rUYRmN/QQM4rMLnrR1HsDz+fVxzFqo7EdywaLzN/pCwRBUJnDLsi7UZRqMSORvndZ1Ed+yHuPIa0N2oJNoT7gwJHJE0qo/zzNjFbK10imivAQ9IPy6r8Tk3dQYpdzWuHAWMIG3xzQhFsZQQOlFTYpxPsZUJBhfXAYFGtICR5bs4fT4d5joMDiJFqg2C2uwPVYviI8YBXQL6IuPeR1iXv4+9e9UsEo1lLyri6zqfpPwzjjFoW3z7QcNEBR/wAEUkiZE+rE3iezeSK53Puvx9YdZMOxJyQCqJpZlz6eRfcAxACZ3Sl68VqUY5ona/oVGRGGgCxSA4qE5ieRZfhyiUV7Nh4r8Aal3m2RhfWiS+CzreQnfiJzgSx1KaUtDdWqgqKn5Y5B5DNIZIEouCncQYH093ovwBozsp2S0YtrM992uepAhQq9Db3tS/AKM79G2p4+kxq3HNEiyTLSi+oJGSIqBxlGQYydiJtU+j/AbRF8mXttEdf4mXsyM8wJ5XvMvUnMg6oN4FGJRXvpEeXttzCzFzIqrZWTUGalS0Mr26QCdWwfI0yv2o3cCo3cpQfvd+flam9aGuwzT9ev4iq2dwXJr+GjE5CdU9LSG+qdkroglUOrE6itUNFP1byDlD3Ds2Mu1nBnDYiXBOaNlWhT9PfVfL1a8FjNZ9l6SupNP9HIS9lpubaJo1CJ34arD6NL6uZdLezKb8Y5VXNljx0f6oTwFO83jlJ4jkCbqcNta20UzRsJEwxIAufC3i2wcpcTMjrOeB7J7wdcGU2uCim0o9CtCgKGd397HMXY/D8oYqmzwQU3tJR+02BAHtxEoStTso68bQ2t1HJLJX9qtuGupvPTVA0DD3sjCLeWov5kZHVLEiiHigDqI9KIqvv6Xk30K+dCtDxWcqr4/6vzRo14OZUF8WMNpyuSC1krT7r8y2FW69Uu1Lk0F1At//JUV+yrbcnZUjI6odDmq+R7cY1JMAg1XQ2fSwrGcjDoc3zdQLkfgcVGOU7U0UvB+xceKRyvNNPM0eiPqxLoPh1LsyfQXGHBvm9TWT12vAQt7/GBvytwLTnYomnmYPRH0IMJp6z+s+kYR8EHQPqBv2eG6GachHWEpZf8SG/K0MVuLXUbJAy1IfAoxImStxTDeWYVRc5tYQfOGJKswO/nzQ/V5kR7h/p+FWSstTewFGafVv7/xTHHMx0cmT9bQ6jbAEniwS9WQJHQUVVKKMOkHUgki4oQxRr2fl5DAGW4+fribUXoDRkaXp+CdBYij5uvR8NZoyxQnHlwDigKASPBfs8xlUDCI2KIySIoFQczhyGv2JYxkqPkmNEkDrjdp+0ZXTJztPJiYXoYxRX8mlwWaxEgs6CWgSJYcwgmefxMgfUN1Fye7AYzeC4kgvCeco1L4K4SSU1yKSRBnBSIZ0ciUUv0k/hqG2AOvD0qRiH8BqHCSLqRvP1wdMkLpODl/vxtN7KPEguI+zfjR70HcYIE4x/UZcuQx4F445nBjnAd9kqLWdj4harkWCxfl5HUeQiW9GJA7GgnLAhf1ioJSDNmcU8e1PKNrrK4cWTiXKQFm2l7MUPTZ1a+XszsPpdT5LzH0vk3Imt+95rNbZyPVA7SxgdE5uR+ydiFkG7AStvfNh8TH0UraPUCp/htsnfg3s3dwxcD4OvncXtAvZjrB64iXgCi5LPYXoWcBjbK/5p605tbaAwp/13I6RN6FzOFJrPgg8XA/opayb2OX+LfcP5+jHnaeOotXeNW/pOCo8grW+t5kWgdoIMJp63pE5hQ5zG8IEtazQUwQoA72U/V+yNXs5zzN5CM0bg+s4GP65KnzXfQmsPe1OozZfejT1uHoh0DGlz3FtEDyEbjzdxov64UMQn6Efl0hsqyqWMtgjVCQseaze6O19wGnUZg14E5ZTiWHkv4FOgtTS+ikicTw7xp6Jj/BQaXgG4pPKGjbaSrm0azlZ6cX1UxAfxtFRJLuHaqhtalix5afeiMUX4CAGwXJBegWGE0Ema7L203DiFTzUdlOwf889pSfCth/eAX4yENJqfC7pWUGS96J6Jo45jj7rIo6DOD7WjvOuzDas3sYL2ZvCBuHNEtueNxZfgHeHEYCEng5ONzC86OPQaRvMr8bTTazL3jQjywfK64hzbPozxORDCL3AJEoRYyyKB2ow0o1wDpgLObrnr+me/EiYbNqOgExh8S1PVLVlzKlhW8nFRFE8hDhCH76OMuF/hxyfIhDWgZJAA/Gdlenl+MwNxJzPhFVrO1AZD+K/VNueKWWQLMIOHPNmehM/5K2kQvG314AhtboQhvdk7gb5I4QCZiHXgALWgogNxZHB6rMU/X9jt/0ZW8Z3zOhNBhHW4HBU+l+IO5eCDKM2jkiQUmUpI+qgCEamX1fVIsiRTHqfZG3u+lofjVBPLLYFDP69U5NHgvRhxFvwe0BtVPyTwGqSsvddnh29kLW5f2LL+I7QSz3wdYj275anP0zceS+WUXxvDN/+AZ9RfBtHdBkinYj407z6oEWQQSiTdE9b2A/beCzu2msAYTWwIn4iIssQ9oTNhRYSHyMpfLuDnH8Fd+TvCccy04KfQHz9HUeRkE9Qtt9nsnwdj008TRyfTHecLvtqMk4/MedShJMwUkYpVEKKJpy+VYM49+sq03DLOyS12YYp6OF0hFZnYW2wD3Tj22d4ufBe7i8+NetKs4KfYtT/KJtDAVfIA+wGHga+x8ruS4g7/wORFUApyOoOjrfE6ktA5IhFByO2tAhrs/8Wk5NgwTdkFYhjNcuI/QD3F5+qdFY9tC89eO2W0mNszt/DICasXJPKf4PhhvQgljX5XzChn0boBLGVzR6ASbuFQQxDeJzffSbv6DkLqFbCtSC1sYAx90hUF/rOt0CKgv1HNucepx+XoQPu7x2MvY97DYhaZAzhMQS8ObWUJB8BKYUZ0RYkiW+fpWDuYxWWU8jQ7f4T6JcBWjkpYTEFKJU6CM/rwHUWzgtULKodWN3GM7kbw/jrXP+96Mzd6VQFGefizKUk9Apc5/XAaJAdrR7QiWeHGMoWOL/7TJLO53B5PRNtR3ixLaCygiRWeqie6rgQlBFZgqe3s50S2xekBa3h9HQPGTkGR88kLhfhyKkY4wEjVDK7xQHyxORtvDNzBw5H4xgHNIelZ57H1HAs/hS8LNWFoRvC823nj6ioWxDN4KMUy5uAat3J/CG8kQ5S9u0knQ/jmtMxEgd2AgWmlhUEa0AfY3qJ0wdSAp3EymE40j3P42o4FnPxG4htmZfESBfI3C1S1OrC4qMYoBerSaz+jqK9go0TW2Ef67a5o/yGce7I38yfjF1MoXwmJTuIr8+jLEW1A8UL480adjn0UApBe93wEUPfPI+r4Vg8CzhIkCeXcDsxpIAic/WCNaxDC5r8jFDWG/DtjazJbaHqZS+cs1PJ7Rt/FHiUfr5HJr0SIx/E4RREcgglwA0XG9HnDSqeTTsasvhTcEwsPnbOaz/Fw5DC2jK+XE/e/z6bck9Unl+McFdkWavNIvOQ/RnH8nNel/4bXPMJHFkGjEFl6yZAEOLOEQs6vgZg8QVo1OBVCrZnQxDqV+2lrA9QsF9gQ+5XwPQG3IsZa61O8VGeYJEns9fSn1hPT/IqYmYlItnwoJhg+hW0fX7xYgow2sLY4+fpdrJAJ0GkYuZS1Eqzi24K/rWszV0NlKcIr9ZTWlSoFAqx+AwUP8A70p8gaT4beMhaDqZjkRYPggC1sIB7nBKdOhF4wnJoghEsVrsZt9ewPvdtCFPe6y+zJBBipddf9jtcmH6CLv0ORhKojIPVdlZWLUJxI7k8qlkQBz0kE+Cj9FC032Z99tthLQZ1KL4qUY1IPy4bshvIF9+PrwWQZJjG1fIspgCD6fNJijhmlMAznJkAFQvaha+/5uXsV8N46qHGdGvHEB79uGws3M+o/QDWFrHEa16MVQcsrgWMDk0xMhnu282MIJ6awLP/zFbKYey0McQXEYlwc+5+8uVPgjWIadkkhIjaXIBJ/3fMfAGkQAK1LzGS3UwQU24s8UVULOH4HRT1K6jtqfWQak1tBGh4HFOpp50B6mBMnnMZphpya0yGQufkpew3mPR+DtDKzSprI0DVZ/B1HD3EVmxXNajlm06wT7mVCW7L/ajyWIuyuAKM7vTncr8FGUY0xkwuvmKx2sUZ6d4pyaCNTjN8hjmz2BYwSE1/hFHQp4A46MGmH0GkiMgR9Ml7WIXlb3HnWYjBQc+DGAZwwveemvW8ELSs1ZvK4t+FUWbyOzNXEjOfQ3UX5qAhKQVcrE6QL11eOe17dgSiGgg/+0z2Eaux3sZef9Yhiy/AKIPkotTpdDk/B8ljxDmoQQiynONYnaBov8e4fw9MPMk5TOznVKHpQgP2e1Dz6+imO3EYqUQfjsZQfIrFPYx07GbbXseiNuGBgbWkFuuQYA9vJZ3EM5sw8mqgiMygOF0rBzd34FuXEp9l7dh19ONyd2jJDra5fTidnJA+nJg9ibh5Aw5/ishyjPQgpAEnEDt5hDF8uwsr2/C9hxnxt/CrwrOV94oq7NpCnDW1WQhH8dt3Z76AIx9F2A0y07h02NdFk3j6MhPlD0878ipAOJYUfYll9MUPw6MPI6/HNcdg7HGIOQpDGnAx4gUNivBhWtGSQyB2ByUG6uPrMD4PUpabWTe6ESgB7Z5/c6C2DSrP7ziNdOIXiBx6d1SLj2gSywSePgyMoWowEnQoQDsR6cWQAWJhBgoIRcDDahkRRVUQkb0SRqF6brkiRG09XNBOVBTff5SSfx23j98M2DpNiqh7at2i1+HPMusw5g3MpkWvxSI4oB3V+hK1QSG4WjA+assoigmjdyqB0KrlUAduFjT1tCPV8LwQEYLGmnE8ex+F8tVsmPivKUVW7Sl5htQuFjkQdgco25+iJEH9Sm/RmWIqdbd5IAtkURlHmQgOiFEPERM4OTjhITNmr1q8A9+E1dcGltKE7wGTGEaJm9Poit/MpZlPhetPbeVC80Ol1hZQOT29hCPlbsSkUS2HYmkkfIJ1Yg8l/xYej/0djw/n2uvCmVHLO1UZwOGB7B7KehOQCaxZw+EQzO27SDjv5kT/3zm/axmrwnVhmwNS63BQ8O/3dxxJX+LOIFt43uuFF4/ggJsllP1t7PD/kl+N76TdEfWA1HqtogxgGJp8npL+FNX0Iafp1xNCDGUPMecNLI/9lFO6+yAsHW2zT2p/YaJeeTtKP8DqTmBmCQr1ihDDMkJM/oSjnB9wCp0Mhs+0eQW1F+AqLIMID04+T1mvR+hBtXGtIBAcuKi7iJtzODx9dbgerP21rkPq5a4M2pWfm1pCRjZh3KWIRscaNDI+sISc/3HWZ3/W3qx+JfVyVwYW4s7cMCX5LqIpFL/hl+6KQSVHp6zi7MRrppVqtgHqR4BBsuoghm1jN1D2Hwbthga3FoKALWHMUpYkr671cOqR+hFg5Hg8S4Fx76tQNwdXzw0VF2WEmFzMxamV4Zq3nq57Tam/NVYQQVDelbmBmHMhVkcwDb6ha9VD6MLqU7w4diEPUAifaVxvf56o1ztRyXtfwvrjODhRO6JaD2r2iAvkMeYk+tKXEe1/tqnDixBNUZvGt1GwP0alF8VfsGa+i4GBsFVviZj8FVP7Zbc49SdAiA58Fnbbb+N5zyCabPg2FkEGTR5jTuaC7uNpZ80A9SpAws3pLeM7mLDfRaVrxn1k6hcFnKA/tDcBsM+u+y1GvQow+HIGMfw2fwOe/U/QLhp5WyZIbE0Az7Gp8Fzl0RanfgUIynaEZykw6X0JX6OO842KBRJ4uhWgnaoVUM8CpBI52Di+GY/bEDI0qhWU8HfVvQuoWpr6FuBUJuzX8DU4XdMetJtC/aHEUEbJFR8CFuLskoak/gUYZRZvyj1BUX+I0ng5g8GJwUmsfQJbDOqK2w4I0AgChGqceNfYtXj2MdCuhtqWESxKAp8HGcIL139tAdIoAowckgfJUuJrGIkjoQQbIUKiCqo+Be/uWg+l3mgUAVYdknVjt1LWO1FNIWEng3q2hcENksTKS+wxDwMt3ZBybxpHgFWUcfk8qgWw9T/+oG65A6v/yUO54TD6Uf9We5Go/y9wKpFDcsfIo5Ts9WCWgHp1/SmCNApDWdcBLX049b5oxIsRjPn0dC9HmE04HIZSqtNSzqivYZ7ny29ny/gOFvoAxQajnm3H/ghSmR7I7qFgv4pKVx1vy1igk5K9jy3jO9rT7ytpRAFWHZLbsz/D9zcjmgnPDK6/L9eqUNI1QHv63QeNfEEcwOeCzjeRjq0BUwrkJ4KpAx0qFiGBZ1/khbHzeZAs7en3FTSmBQzwGcBh48Qj+PwYWBKcRKn1cVMFfW66KNsNPEi2vfm8bxpZgEE8dRBD2f8GlucwpoP6SVYInI8JezMAq2s8mjqlsQW4Cst2hDX53RRKXwp6y9TBJq/FR7UTT3/FXePbwjSyerkx6orGFiBU48S3j9+I79+N0fpI2VIMRXsDoJVDGtu8gma4MNG6ypL3VuHjUcvPpViMduDbR3k0t4l2AdIBaQYBTomQTPwaT64HlqCUazKWIEmig0n9N55nMiy/bDsf+6E+PMb5IShbektqCa92NmFYClI65MbncyHYeklStn/g6bGLeYSxyjNt9klzWMCAYK31UG6Ygv0KIqkZnEM3v0TWr+D/K48w2rZ+B6eZBDjFIcneRNnfjEgQIVkMFAvagW9/x678jTTywdqLSHMJsGptfLLeNagGU/BC20Eb/m4lScFey1bGGESohy2hOqeZ1oBVokaQ70j9bzrcjwO7UdwFu900TDrw7G8YGXsX51DazwGKbfai2SxgwGosijCm38LTZxDtWLDOClEChFWhUP4GQxTCpIO2+GZAcwowckjuze+iaL+MSgfMc99p1bAmRS2QwWcd6yc2Mohpt+GdOc0qwCk1JNnVlOxdiMxvhEQlOL7QiIPqCKP2C/P23i1E8wqwiiVX/jzWTsJ8Z6SoB2Qo2W8xlH2yfTzXodPcAowiJJsnHqFgfwxkUPXmp+Gl+iAZyv593Jb9fqWza5tDojm94OlUIyRHOetxWY6VEmZON19QaKQI4+VLWJ/fTvtIrlnR3BYwQLkK4aHcMJPel7EkiTZOZo8P9ODZa1if3x4mm7bFNwtaQYDVtr/r87dQ1s2IpjGzdEgsZWApvv6CW8d+0D58Zm64tR7AImPJe5+n1z0NMc4h+yOKh9CN1SfJ+leGJ6S3Ld8caA0LCFWH5K7x31DkJ6ApDm1bxgIxVH3GSx/lztwwV7U3nOdKKzghUwmyU97ecQQ9iTsw0gkH7cBfTXiFpRTsf+e2sVvaU+/80DoWMCA4k+6uyRco6/UoB7eCClgtgxxG0V7DbWO30I/bFt/80GoWECIreFZ3H8ucO3BMzwHPIQlOQV9Oyb+OW7N/H1q+oDFcmznTahYQIit4b34Xvl6HJY3sZc2iTeogrX8ZZXsjt2b/IYzztsU3j7SiBQQQBhG2kiSWuR1H/hhkspK+rwhKCcNSynYDj459kCcohVerLb55pBUtIEQiWsME494qlHgYL4nEVcLQR8m/h0fHPsiTFMMpui2+eaZVBVjdltk4vhnPfgt0OYGna4HDKPoP8KJ+mCcp0g6ztVkgJGyZJlyW+S7v6dnJe3peYGX6h7yJHoD2eW5tFprqOvjt3WdzbuqMyv+3xdemhrSqg9amZgzgtM9wW1z+P9j68GR0jva1AAAAAElFTkSuQmCC';
  function loadLogo() {
    return new Promise(function (resolve) {
      var logo = new Image(), done = false;
      function fin(v) { if (!done) { done = true; resolve(v); } }
      logo.onload = function () { fin(logo); }; logo.onerror = function () { fin(null); };
      setTimeout(function () { fin(null); }, 3000);
      logo.src = LOGO_DATA;
    });
  }
  function build(data) {
    var d = data || {};
    var fonts = (document.fonts && document.fonts.load)
      ? Promise.race([Promise.all([document.fonts.load('600 14px Inter'), document.fonts.load('700 21px Inter')]).catch(function () {}), new Promise(function (r) { setTimeout(r, 2500); })])
      : Promise.resolve();
    return Promise.all([loadLogo(), fonts]).then(function (r) {
      return paint(d, r[0], SCALE).catch(function (e1) {
        console.warn('Struk: percobaan 1 gagal, mencoba mode ringan.', e1);
        return paint(d, null, 2).catch(function (e2) { e2.message = 'Pembuatan struk gagal: ' + (e2.message || e1.message); throw e2; });
      });
    });
  }
  // Data struk dari objek pesanan (dipakai halaman order, struk, dan lacak agar isinya selalu sama).
  function fromOrder(o) {
    var qty = Math.max(1, Number(o.jumlah) || 1), ong = Number(o.ongkir || 0), dis = Number(o.diskon || 0), tot = Number(o.totalHarga || 0);
    var sub = o.subtotal != null ? Number(o.subtotal) : Math.max(0, tot - ong + dis);
    var tg = o.tanggalKirim ? new Date(o.tanggalKirim + 'T00:00:00') : null;
    var tgl = tg && !isNaN(tg) ? tg.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    return {
      id: o.orderId, tanggal: o.tanggal || new Date(o.createdAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      nama: o.nama || '-', produk: o.produk || '-', qty: qty, unit: Math.round(sub / qty), subtotal: sub, shipping: ong, discount: dis, total: tot,
      bayar: o.metodePembayaran || '-', paymentStatus: o.statusPembayaran || (o.metodePembayaran === 'QRIS' ? 'Menunggu verifikasi' : 'Bayar saat terima'),
      status: (!o.status || o.status === 'Belum terkirim') ? 'Pesanan diterima' : o.status, pending: Boolean(o.pending),
      jadwal: [tgl, o.jamKirim].filter(Boolean).join(' · ')
    };
  }
  window.MFReceipt = {
    build: build,
    fromOrder: fromOrder,
    save: function (built) { return deliver(built.blob, built.name); },
    download: function (data) { return build(data).then(function (b) { return deliver(b.blob, b.name); }); }
  };
})();
