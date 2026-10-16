# Aynı Wi-Fi üzerinden telefon testi

Uzak yayın/Vercel kurulumu kullanıcı kararıyla yapılmadı. Bu yöntem özel alan adı, bulut hesabı veya tünel oluşturmaz.

1. Telefon ve bilgisayarı aynı, güvendiğin özel Wi-Fi ağına bağla.
2. VS Code terminalinde proje kökünden çalıştır:

   ```powershell
   npm run build
   npm run preview:lan
   ```

3. Terminalin yazdığı `Phone URL` adresini telefonda aç. Telefonda `localhost` kullanma; localhost telefonun kendisidir. Bilgisayar açık, terminal çalışır durumda kalmalı. Durdurmak için `Ctrl+C`.
4. Birden fazla ağ bağdaştırıcısı varsa komut başlamadan adresleri listeler. Kendi Wi-Fi adresini seç:

   ```powershell
   npm run preview:lan -- --host <bilgisayarının-Wi-Fi-IPv4-adresi>
   ```

   Açılı parantezli metin yerine listelenen gerçek adresi kullan. Sadece aktif yerel bağdaştırıcılara atanmış özel IPv4 adreslerine izin verilir. Varsayılan port 3001’dir; gerekirse `--port 3002` kullanabilirsin.

## Önemli sınırlar

- Bu komut geliştirme/HMR sunucusunu değil, son `npm run build` çıktısını sunar. Kod değişince yeniden build et ve önizlemeyi yeniden başlat.
- Test sunucusu ancak bu komutu çalıştırınca başlar. Ön kontrol için `npm run preview:lan -- --check` kullan; bu seçenek port açmaz.
- Ağındaki kişiler erişebilir. Bu bir kimlik doğrulamalı özel paylaşım sistemi değildir; yalnızca güvendiğin ev/iş ağında kullan. Ortak/kafe Wi-Fi’sinde kullanma.
- Yerel HTTP şifreli değildir. Admin parolanı girme ve gerçek kişisel/hassas verilerle form testi yapma. Üretim için HTTPS gerekir.
- Windows güvenlik duvarı veya router’daki istemci izolasyonu telefon erişimini engelleyebilir. Bu çalışma güvenlik duvarını kapatmaz veya kural eklemez. Router port yönlendirmesi yapma.
- Bilgisayarın farklı Wi-Fi ağına geçmesiyle adres değişebilir; yeniden komutu çalıştır.
- Aynı ağ dışındaki arkadaşların bu adresle erişemez. Uzak test için ayrıca onaylanmış, erişim korumalı bir çözüm gerekir; şu an kurulmadı.
- E-posta teslimatı hâlâ Resend yapılandırmasına ve canlı teslimat testine bağlı. Arayüzün açılması, e-postanın teslim edildiği anlamına gelmez.
