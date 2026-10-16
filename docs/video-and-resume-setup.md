# YKA: video, izlenmeler ve CV

## 1. Veritabanı

Supabase Dashboard → SQL Editor → New query altında
`supabase/migrations/202610160005_video_and_resume.sql` dosyasını çalıştırın.
Bu dosya mevcut projelere video ve izlenme alanlarını ekler. CV taslakları için
yetkili yöneticilere açık, işlem bütünlüğü olan bir aktarım fonksiyonu oluşturur.
Mevcut kayıtları değiştirmez, silmez, RLS'yi kapatmaz; yeniden çalıştırılabilir.
Migration uygulanana kadar mevcut site eski verilerle çalışır. Yeni alanları
kaydeden admin işlemleri migration gerektiğini bildirir.

## 2. Yüksek kaliteli videolar

Büyük kaynak dosyaları için Cloudflare Stream entegrasyonu hazırlanmıştır.
Stream ayrı ve ücretli bir hizmettir. Hesabı ve bütçeyi kontrol etmeden açmayın.
Bu değişiklik hesap oluşturmaz, ödeme başlatmaz veya mevcut videoları taşımaz.

1. Cloudflare Dashboard → Stream → Videos üzerinden Stream'i etkinleştirin.
2. Hesabınızın Account ID değerini alın.
3. My Profile → API Tokens → Create Token → Create Custom Token:
   yalnızca ilgili hesabın Stream düzenleme iznini verin (Account → Stream → Edit).
4. Projenin `.env.local` dosyasına yalnızca sunucu değişkenlerini ekleyin:

   ```dotenv
   CLOUDFLARE_ACCOUNT_ID=
   CLOUDFLARE_STREAM_API_TOKEN=
   ```

5. `npm run dev` sürecini yeniden başlatın. Canlı ortamda aynı iki değişkeni
   hosting sağlayıcısının sunucu ortamına ekleyin.
6. `/admin/projects` → Proje → **Video**: dosyayı ve videoya yakın maksimum
   süreyi seçin. Yükleme doğrudan Stream'e gider; API anahtarı tarayıcıya gitmez.
   Duraklat/devam et desteklenir. Sayfa kapatılırsa aynı tarayıcıda aynı dosyayı
   seçin; TUS kayıtlı yükleme konumundan devam eder. Tarayıcı depolaması silinmiş
   veya yükleme URL'si sona ermişse Stream Dashboard'dan durumu kontrol edin.
7. Yüklemeden sonra admin açıkken işleme durumu kontrol edilir. Daha sonra
   tekrar açarsanız **Durumu kontrol et** düğmesini kullanın. Hazır video, ancak
   projenin **Published** ayarı da açıksa portfolyoda gösterilir.

Videolar adaptif yayın için dönüştürülür. Mevcut Instagram/YouTube ve Supabase
videoları korunur. Aynı projede hazır Stream videosu önceliklidir. Mevcut Stream
videosu yeni sürüm hazırlanırken gösterilmeye devam eder. Yeni video hazır
olduğunda bağlantı değiştirilir; eski video kimliği arşivde korunur, uzaktaki
dosya silinmez. Tamamlanmamış yükleme arşivlenip yeni yükleme başlatılabilir.
Kaynak dosyaları kendi arşivinizde tutun. Arşivlenen varlıklar Stream kotasını
kullanmaya devam edebilir; Cloudflare Dashboard'dan inceleyin.

Resmi kaynaklar:
[Doğrudan yükleme](https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/),
[büyük dosyalar ve devam edebilen yükleme](https://developers.cloudflare.com/stream/uploading-videos/resumable-uploads/).

## 3. Sosyal medya / reklam izlenmeleri

Proje düzenleme sayfasındaki **Sonuçlar** alanına platformdan veya rapordan
doğruladığınız tam izlenme sayısını, kaynağı ve ölçüm tarihini girin.
İsteğe bağlı kaynak URL'si sadece herkese açık bir bağlantı olmalıdır.
Özel kampanya raporu veya erişim tokenı eklemeyin.

Sayılara erişmek için Instagram scraping yapılmaz. Bu sürümde değerler manuel
güncellenir; Instagram Insights, YouTube Analytics ve reklam platformlarına
otomatik bağlantı kurulmamıştır. Sayılar web sitesinin oynatma sayacı değildir.
Eksik istatistikler sıfır gibi gösterilmez. Farklı platform sayıları toplanmaz.

## 4. CV

`/admin/resume` → **CV dosyanı ekle** bölümünden PDF yükleyin.
Dosya en fazla 10 MB ve 30 sayfa olabilir. Yeni dosya, sitenin CV indirme ve
görüntüleme bağlantısına bağlanır; eski PDF silinmez. Bu yükleme CV dosyasını
herkese açık yapar. Yalnızca paylaşmak istediğiniz bilgilerin bulunduğu PDF'yi
yükleyin. Deneyim kayıtları yükleme sırasında değiştirilmez.

PDF metni yerel sunucuda çıkarılır. Taranmış dosyalarda OCR uygulanmaz;
metin çıkarılamazsa PDF gösterimi ve elle kayıt oluşturma çalışmaya devam eder.
Üç bölümde yeni deneyim, eğitim ve gönüllülük taslakları ekleyebilirsiniz.

İsteğe bağlı CV asistanı için `.env.local` içine şu sunucu değişkenlerini ekleyin:

```dotenv
RESUME_AI_API_KEY=
RESUME_AI_MODEL=
RESUME_AI_API_URL=https://api.openai.com/v1/chat/completions
```

Chat Completions JSON çıktısını destekleyen bir sağlayıcı kullanılır.
CV metni ancak **CV'den düzenlenebilir taslak oluştur** düğmesine basıldığında
sağlayıcıya gönderilir. PDF'nin kendisi veya giriş parolası gönderilmez.
Üretilen taslakta kurum, tarih ve iki dildeki açıklamaları inceleyin.
Yalnızca yıl/ay verilen tarihlerde gün 01 olarak temsil edilir; kontrol edin.
Eksik deneyim başlangıç tarihleri tamamlanmadan kaydetme yapılamaz.

İnceleme kutusunu işaretleyip kaydedin. Yeni kayıtlar **published=false** olarak
oluşur; mevcut kayıtların üzerine yazılmaz. Kurum ve başlangıç tarihi aynı olan
kayıtlar atlanır. Bir kurumda aynı tarihte iki farklı görev gerekiyorsa ilgili
bölümün normal kayıt ekleme formunu kullanın. Her kayıt daha sonra kendi
bölümünde **Published** seçeneğiyle yayımlanır. Yetkinlik ve diller mevcut
yönetim ekranlarından düzenlenir; CV asistanı bunları otomatik değiştirmez.

PDF metni okuma: [unpdf](https://github.com/unjs/unpdf).
