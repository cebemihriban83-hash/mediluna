/* MediLuna — içerik kütüphanesi (tamamı özgün, kendi yazdığımız metinler) */
"use strict";

/* v1 LANSMAN: tüm içerik ücretsiz — v1.1'de RevenueCat ile gerçek abonelik
   gelince false yapılacak (kilitler ve paywall geri döner) */
const LANSMAN_MODU = true;

const CATS = [
  { id: "hepsi",     name: "Hepsi" },
  { id: "stres",     name: "Stres" },
  { id: "kaygi",     name: "Kaygı" },
  { id: "uyku",      name: "Uyku" },
  { id: "odak",      name: "Odak" },
  { id: "ozguven",   name: "Özgüven" },
  { id: "iliskiler", name: "İlişkiler" },
  { id: "ofke",      name: "Öfke" },
  { id: "sukran",    name: "Şükran" },
  { id: "sefkat",    name: "Öz-Şefkat" },
];

const CAT_ART = {
  stres: ["😮‍💨", "linear-gradient(135deg,#2b5876,#4e4376)"],
  kaygi: ["🌊", "linear-gradient(135deg,#134E5E,#2d7d6e)"],
  uyku: ["🌙", "linear-gradient(135deg,#141E30,#3a4d6b)"],
  odak: ["🎯", "linear-gradient(135deg,#1e3c72,#2a5298)"],
  ozguven: ["💪", "linear-gradient(135deg,#4b3869,#7a5a96)"],
  iliskiler: ["💛", "linear-gradient(135deg,#5c4a2e,#8a6d3b)"],
  ofke: ["🌋", "linear-gradient(135deg,#5c2b2b,#8a4b3b)"],
  sukran: ["🌻", "linear-gradient(135deg,#4a4a1e,#7a6d2b)"],
  sefkat: ["🌸", "linear-gradient(135deg,#5a2e4d,#8a5a7a)"],
};

/* Özel çizim ikon seti (stroke tabanlı, currentColor) */
const ICONS = {
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.1"/><path d="M12 2.6v2.3M12 19.1v2.3M2.6 12h2.3M19.1 12h2.3M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/></svg>',
  compass: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.6"/><path d="M15.4 8.6l-2 4.8-4.8 2 2-4.8z"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M19.8 14.2A8.2 8.2 0 1 1 9.8 4.2a6.6 6.6 0 0 0 10 10z"/></svg>',
  wind: '<svg viewBox="0 0 24 24"><path d="M3 8.2h8.8a2.3 2.3 0 1 0-2.2-3M3 12.6h12.6a2.4 2.4 0 1 1-2.3 3.1M3 17h6.4a2 2 0 1 1-1.9 2.6"/></svg>',
  user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8.2" r="3.5"/><path d="M5.2 19.8a6.8 6.8 0 0 1 13.6 0"/></svg>',
  rain: '<svg viewBox="0 0 24 24"><path d="M7.2 14.5a4.6 4.6 0 1 1 .7-9.1A5.5 5.5 0 0 1 18.6 7a3.4 3.4 0 0 1-1.1 6.6H7.2z"/><path d="M8.4 17.2l-1 2.6M12.4 17.2l-1 2.6M16.4 17.2l-1 2.6"/></svg>',
  ocean: '<svg viewBox="0 0 24 24"><path d="M2.5 9.2c2.4 0 2.4 1.9 4.8 1.9s2.4-1.9 4.7-1.9 2.4 1.9 4.8 1.9 2.4-1.9 4.7-1.9M2.5 15c2.4 0 2.4 1.9 4.8 1.9s2.4-1.9 4.7-1.9 2.4 1.9 4.8 1.9 2.4-1.9 4.7-1.9"/></svg>',
  waterfall: '<svg viewBox="0 0 24 24"><path d="M4.5 4.5h9M8 4.5c.2 4.6-.8 8.3-3.4 11.6M12.5 4.5c-.1 5.2 1 8.7 5.4 11.4"/><path d="M3.5 19c2.2 1.4 4.6 1.4 6.8 0M13.5 19.4c2 1.2 4.2 1.2 6.2 0"/></svg>',
  farm: '<svg viewBox="0 0 24 24"><path d="M4.5 19.5V10L12 4.8 19.5 10v9.5z"/><path d="M9.8 19.5v-5.4h4.4v5.4M4.5 12.6L12 7.6l7.5 5"/></svg>',
  fire: '<svg viewBox="0 0 24 24"><path d="M12 3.6c.7 3-3.6 4.9-3.6 8.6a4.9 4.9 0 0 0 9.8.2c0-3.8-2.8-5-3.2-8.8-.9.9-1.8 2.1-1.5 3.6-.9-.9-1.5-2.1-1.5-3.6z"/></svg>',
  forest: '<svg viewBox="0 0 24 24"><path d="M12 3.2l4.6 6.4h-2.7l3.7 5.6H6.4l3.7-5.6H7.4z"/><path d="M12 15.2v5"/><circle cx="19.4" cy="4.6" r="1.1"/></svg>',
  radio: '<svg viewBox="0 0 24 24"><rect x="4" y="9.2" width="16" height="9.8" rx="2"/><path d="M7.5 9.2l8.5-4.7"/><circle cx="9.2" cy="14.1" r="2.1"/><path d="M14.2 12.6h3.6M14.2 15.6h3.6"/></svg>',
  tone: '<svg viewBox="0 0 24 24"><path d="M2.5 12c1.6-5.8 3.2-5.8 4.8 0s3.2 5.8 4.7 0 3.2-5.8 4.8 0 3.2 5.8 4.7 0"/></svg>',
  noise: '<svg viewBox="0 0 24 24"><path d="M4 14.5v-5M8 17.5V6.5M12 19.5V4.5M16 16.5V7.5M20 13.5v-3"/></svg>',
};

/* Duygu ölçeği (duygu günlüğü) */
const MOODS = [
  [1, "😖", "Gergin"],
  [2, "😕", "Yorgun"],
  [3, "😐", "İdare eder"],
  [4, "😌", "Sakin"],
  [5, "🤩", "Harika"],
];

/* Rehberli meditasyonlar — lines: [saniye, metin] */
const MEDITATIONS = [
  {
    id: "m1", cat: "stres", title: "Omuzlardaki Yük", dur: 5, sound: "rain", premium: false,
    lines: [
      [0,   "Rahat bir pozisyon al. Gözlerini yavaşça kapat."],
      [20,  "Derin bir nefes al… ve bırak. Omuzlarının düştüğünü hisset."],
      [50,  "Bugün taşıdığın her şeyi bir an için yere bırakıyorsun."],
      [90,  "Nefes aldıkça göğsünün genişlediğini fark et."],
      [130, "Verdiğin her nefesle gerginlik biraz daha eriyor."],
      [180, "Omuzların, çenen, alnın… hepsi yumuşuyor."],
      [230, "Sadece bu an var. Yağmurun sesi ve senin nefesin."],
      [270, "Yavaşça parmaklarını oynat. Hazır olduğunda gözlerini aç."],
    ],
  },
  {
    id: "m2", cat: "stres", title: "5 Dakikada Sıfırla", dur: 5, sound: "ocean", premium: false,
    lines: [
      [0,   "Bu beş dakika sadece senin. Telefonu çevir, dünyayı beklet."],
      [25,  "Burnundan dört sayarak nefes al… bir, iki, üç, dört."],
      [55,  "Ağzından altı sayarak ver. Dalga geri çekilir gibi."],
      [95,  "Zihninde düşünceler belirebilir. Sorun değil; bulut gibi geçmelerine izin ver."],
      [140, "Her nefes bir dalga. Geliyor… ve gidiyor."],
      [190, "Vücudunda gevşeyen yerleri tek tek fark et."],
      [240, "Kendine teşekkür et. Durmayı seçtin, bu bir güç."],
      [280, "Gözlerini açtığında daha hafif olacaksın."],
    ],
  },
  {
    id: "m3", cat: "kaygi", title: "Fırtınada Liman", dur: 7, sound: "wind", premium: false,
    lines: [
      [0,   "Kaygı bir fırtınaysa, nefesin senin limanın. Gözlerini kapat."],
      [30,  "Ayaklarının yere değdiğini hisset. Yer seni taşıyor."],
      [70,  "Şu an güvendesin. Bu cümleyi içinden tekrar et: Şu an güvendeyim."],
      [120, "Kaygı geleceğe dair bir hikâye anlatır. Sen şimdiye dön."],
      [180, "Beş şey say: duyduğun sesler… nefesin… kalbin…"],
      [240, "Rüzgâr dışarıda essin. Senin içinde sessiz bir oda var."],
      [310, "O odada otur. Acele etme."],
      [380, "Hazır olduğunda derin bir nefesle geri dön."],
    ],
  },
  {
    id: "m4", cat: "kaygi", title: "Düşünce Bulutları", dur: 6, sound: "ciftlik", premium: true,
    lines: [
      [0,   "Sırt üstü bir çayırda uzandığını hayal et. Uzakta bir çiftlik var."],
      [30,  "Gökyüzünde bulutlar var. Her bulut bir düşüncen."],
      [75,  "Bir düşünce geldiğinde onu bulutun üstüne koy."],
      [130, "Ve izle… bulut ağır ağır süzülüp gidiyor."],
      [190, "Sen gökyüzüsün. Düşünceler sadece geçici bulutlar."],
      [250, "Gökyüzü hiçbir buluta tutunmaz. Sen de tutunma."],
      [310, "Son bir kez: geniş, sonsuz ve sakinsin."],
    ],
  },
  {
    id: "m5", cat: "odak", title: "Tek Nokta", dur: 5, sound: "white", premium: false,
    lines: [
      [0,   "Dik otur. Zihnini tek bir noktaya davet ediyoruz: nefesine."],
      [25,  "Burnundan giren havanın serinliğini fark et."],
      [60,  "Zihin kaçtı mı? Normal. Nazikçe geri getir. Bu bir tekrar, ceza değil."],
      [110, "Her geri dönüş, odak kasını güçlendirir."],
      [160, "Nefes… sadece nefes. Başka görev yok."],
      [210, "Şimdi bu berraklığı günün geri kalanına taşı."],
      [270, "Gözlerini aç. Zihnin keskin, için sakin."],
    ],
  },
  {
    id: "m6", cat: "odak", title: "Derin Çalışma Öncesi", dur: 3, sound: "white", premium: true,
    lines: [
      [0,   "Üç dakika sonra işine tam güçle döneceksin."],
      [20,  "Önce zihnindeki sekmeleri tek tek kapat."],
      [50,  "Yapılacaklar listesi şimdilik beklemede. Sadece nefes."],
      [90,  "Yapacağın tek işi zihninde canlandır. Sadece onu."],
      [130, "Nefes al: enerji. Nefes ver: dağınıklık."],
      [160, "Hazırsın. Tek nokta, tam güç."],
    ],
  },
  {
    id: "m7", cat: "ozguven", title: "İç Sesini Yumuşat", dur: 6, sound: "rain", premium: true,
    lines: [
      [0,   "Gözlerini kapat. Bugün kendine nasıl konuştuğunu hatırla."],
      [35,  "O sesi bir arkadaşına kullanır mıydın?"],
      [85,  "Şimdi aynı cümleyi şefkatle yeniden kur."],
      [140, "İçinden söyle: Elimden geleni yapıyorum ve bu değerli."],
      [200, "Hataların seni küçültmez; büyüdüğünün kanıtıdır."],
      [260, "Omuzlarını geri al. Yerin burası, hak ederek buradasın."],
      [320, "Bu sesi yanına al. O artık senin iç sesin."],
    ],
  },
  {
    id: "m8", cat: "iliskiler", title: "Şefkat Nefesi", dur: 6, sound: "forest", premium: true,
    lines: [
      [0,   "Sevdiğin birini zihninde canlandır. Yüzünü, gülüşünü."],
      [40,  "Nefes alırken ona iyi dilekler gönder: Huzurlu ol."],
      [100, "Nefes ver: Sağlıklı ol. Güvende ol."],
      [160, "Şimdi aynı dilekleri kendine gönder. Sen de hak ediyorsun."],
      [230, "Zor bir ilişkin varsa, o kişiye de küçük bir dilek dene."],
      [290, "Şefkat bir kas. Her nefeste güçleniyor."],
    ],
  },
  {
    id: "m9", cat: "uyku", title: "Bedeni Uğurlama", dur: 8, sound: "rain", premium: false,
    lines: [
      [0,   "Yatağına iyice yerleş. Bu meditasyonun sonunda uyuyakalabilirsin; amaç da bu."],
      [40,  "Ayak parmaklarından başla. Onlara 'iyi geceler' de, bırak ağırlaşsınlar."],
      [110, "Bacakların yatağa gömülüyor. Sıcak ve ağır."],
      [190, "Karnın, göğsün… nefesinle birlikte yumuşuyor."],
      [270, "Ellerin, kolların… bugün çok çalıştılar. Artık dinlensinler."],
      [350, "Yüzün… çenen gevşiyor, alnın düzleşiyor."],
      [420, "Yağmur camda, sen güvendesin. Her şey yarına kadar bekleyebilir."],
      [460, "Uykuya teslim ol…"],
    ],
  },
  {
    id: "m10", cat: "uyku", title: "Gece Yarısı Uyanınca", dur: 5, sound: "ocean", premium: true,
    lines: [
      [0,   "Uyandın ve zihin hemen çalışmaya başladı. Sorun değil, buradayız."],
      [30,  "Saate bakma. Gece senin düşmanın değil."],
      [80,  "Nefesini say: dört al… altı ver…"],
      [140, "Dalgalar sahile vuruyor. Her dalga bir düşünceyi alıp götürüyor."],
      [200, "Beden zaten yorgun. Ona sadece izin vermen gerek."],
      [260, "Bırak… okyanus seni sallasın…"],
    ],
  },
  {
    id: "m11", cat: "stres", title: "Sabah Zırhı", dur: 4, sound: "ciftlik", premium: true,
    lines: [
      [0,   "Güne başlamadan önce dört dakikalık zırhını kuşan."],
      [25,  "Bugün seni ne bekliyorsa, onu karşılayacak gücün var."],
      [70,  "Nefes al: sabır. Nefes ver: acele."],
      [120, "Bugün kontrol edemeyeceğin şeyler olacak. Onları şimdiden bırak."],
      [175, "Kontrol edebildiğin tek şey: kendi adımın, kendi nefesin."],
      [220, "Gözlerini aç. Gün seni bekliyor, sen hazırsın."],
    ],
  },
  {
    id: "m12", cat: "ozguven", title: "Aynadaki Dost", dur: 5, sound: "selale", premium: false,
    lines: [
      [0,   "Bir şelalenin yanında, bir ayna karşısında durduğunu hayal et."],
      [30,  "Karşındaki kişiye ilk bakışta ne söylerdin?"],
      [80,  "Şimdi ona bir dostun gözüyle bak. Yorgunluğunu, çabasını gör."],
      [140, "O kişi bugüne kadar her zorluğu atlattı. Kanıt: burada duruyor."],
      [200, "Ona söyle: Seninle gurur duyuyorum."],
      [255, "Aynadaki dost, sensin."],
    ],
  },
  {
    id: "m13", cat: "odak", title: "İlk Nefes", dur: 3, sound: "white", premium: false,
    lines: [
      [0, "Hoş geldin. Bu ilk günün. Kendinden hiçbir şey bekleme; sadece burada ol."],
      [25, "Rahat bir pozisyon al. Gözlerini yavaşça kapat ya da bakışını yere indir."],
      [50, "Şimdi nefesini fark et. Onu değiştirme; zaten kendi kendine akıyor."],
      [78, "Havanın içeri girişini hisset… ve dışarı çıkışını. Şimdilik tek işin bu."],
      [108, "Zihnin dağılırsa üzülme. Fark etmek de çalışmanın parçası. Nazikçe nefese dön."],
      [152, "Gözlerini yavaşça aç. İlk adımı attın. Yarın yeniden buluşuruz."],
    ],
  },
  {
    id: "m14", cat: "stres", title: "Bedeni Dinlemek", dur: 4, sound: "rain", premium: false,
    lines: [
      [0, "Hoş geldin. Dün nefesi fark etmeyi denemiştik. Bugün bedenine kulak vereceğiz."],
      [25, "Rahatça yerleş. Derin bir nefes al… ve bırak. Omuzların kendiliğinden yumuşasın."],
      [52, "Dikkatini alnına getir. Orada bir gerginlik var mı? Sadece fark et."],
      [82, "Yavaşça aşağı in: çene, boyun, omuzlar. Tuttuğun yerlere nefesini gönder."],
      [115, "Şimdi sırtın, karnın, ellerin. Her nefes verişte biraz daha bırak."],
      [155, "Bacaklarına ve ayaklarına in. Bedeninin yere değdiği her noktayı hisset."],
      [205, "Bütün bedenini tek parça olarak duyumsa. Gözlerini aç. Bu dinleme alışkanlığı artık seninle."],
    ],
  },
  {
    id: "m15", cat: "kaygi", title: "Nehirdeki Yapraklar", dur: 4, sound: "wind", premium: false,
    lines: [
      [0, "Hoş geldin. Dün bedenindeki gerginlikleri fark etmiştin. Bugün zihnine bakacağız."],
      [25, "Gözlerini kapat. Birkaç nefesle buraya yerleş. Acele yok."],
      [52, "Bir nehir kenarında oturduğunu hayal et. Su sakin sakin akıyor."],
      [82, "Aklına gelen her düşünceyi, suyun üstünde süzülen bir yaprağa koy."],
      [115, "Yaprak akıntıyla uzaklaşsın. Tutmana gerek yok, itmene de. Sadece izle."],
      [158, "Bir düşünceye kapıldığını fark edersen, kıyıya geri otur. Yeni bir yaprak her zaman var."],
      [205, "Nehri orada bırak. Nefesine dön ve gözlerini aç. Düşünceler gelir, geçer; sen kalırsın."],
    ],
  },
  {
    id: "m16", cat: "odak", title: "Seslerin Çapası", dur: 4, sound: "forest", premium: false,
    lines: [
      [0, "Hoş geldin. Dün düşünceleri nehirde uğurlamıştık. Bugün çapamız sesler olacak."],
      [25, "Rahatça otur. Gözlerini kapat. Bir iki derin nefesle yerleş."],
      [52, "Şimdi kulaklarını aç. Çevrendeki en uzak sesi bul."],
      [82, "Sesleri adlandırmana gerek yok. İyi ya da kötü deme; sadece duy."],
      [115, "Yakındaki seslere gel. Belki kendi nefesinin sesi, belki odanın uğultusu."],
      [158, "Zihnin dalarsa herhangi bir ses seni geri çağırsın. Ses, şimdiye açılan bir kapı."],
      [205, "Son bir kez dinle… Gözlerini aç. Sesler hep buradaydı; sen de artık buradasın."],
    ],
  },
  {
    id: "m17", cat: "kaygi", title: "Dalgalara İzin", dur: 5, sound: "ocean", premium: false,
    lines: [
      [0, "Hoş geldin. Dün sesleri çapa yapmıştık. Bugün içeride olup bitene yer açacağız."],
      [24, "Gözlerini kapat. Nefesin doğal ritmine bırak kendini."],
      [50, "Bir kıyıda durduğunu düşün. Önünde uçsuz bucaksız bir deniz. Dalgalar geliyor ve çekiliyor."],
      [78, "Şu an içinde bir duygu var mı? Kaygı, sıkıntı, belki sadece yorgunluk. Ne varsa, olsun."],
      [108, "O duyguyu bir dalga gibi düşün. Yükseliyor… tepe yapıyor… ve iniyor."],
      [140, "Dalgayla savaşma. Kum gibi ol; bırak üzerinden geçsin, sonra çekilsin."],
      [175, "Duygu bedeninde bir yerde duruyorsa, oraya nefes gönder. Yer aç, genişle."],
      [220, "Her dalga gider. Hiçbiri kalıcı değil. Sen kıyısın; dalga değilsin."],
      [268, "Nefesinle geri dön. Gözlerini aç. Duygularına yer açmak, sessiz bir beceri; bugün onu çalıştın."],
    ],
  },
  {
    id: "m18", cat: "sefkat", title: "İçindeki Nazik Ses", dur: 5, sound: "selale", premium: false,
    lines: [
      [0, "Hoş geldin. Dün duygulara yer açmıştık. Bugün kendinle konuşma biçimine bakacağız."],
      [24, "Rahatça otur. İstersen bir elini kalbinin üstüne koy. Gözlerini kapat."],
      [50, "Avucunun sıcaklığını hisset. Bu sıcaklık, kendine getirdiğin küçük bir armağan."],
      [78, "İçindeki sesi bir dinle. Gün boyunca sana nasıl sesleniyor? Sert mi, aceleci mi?"],
      [108, "Şimdi o tonu yumuşat. Sevdiğin bir dosta nasıl konuşuyorsan, kendine de öyle seslen."],
      [140, "İçinden şu cümleyi geçir: Bugün elimden geleni yaptım. Bu bana yeter."],
      [178, "Zorlandığın bir anını hatırla. O anki haline şimdi nazikçe bak. Suçlamadan, sadece anlayışla."],
      [222, "Nefes alırken bu yumuşaklığı içine çek. Nefes verirken sertliği bırak."],
      [268, "Elini indir, gözlerini aç. O nazik ses artık senin; gün içinde onu istediğinde çağırabilirsin."],
    ],
  },
  {
    id: "m19", cat: "odak", title: "Yanındaki Sessizlik", dur: 6, sound: "ciftlik", premium: false,
    lines: [
      [0, "Hoş geldin. Bugün yedinci gün. Altı gündür adım adım geldin; bugün hepsini birleştiriyoruz."],
      [24, "Gözlerini kapat. Burası artık tanıdık bir yer. Nefesin seni karşılasın."],
      [50, "Kısaca hatırla: nefesi izledin, bedeni dinledin, düşünceleri suya bıraktın."],
      [78, "Sesleri duydun, dalgalara yer açtın, iç sesini yumuşattın. Hepsi hâlâ seninle."],
      [108, "Şimdi bir sabah düşün. Çayını ya da kahveni alıyorsun. Fincanın sıcaklığı avucunda."],
      [140, "İlk yudumu tam dikkatle iç. Kokusu, buharı, tadı. İşte bu da bir meditasyon."],
      [175, "Bir de yürüdüğünü düşün. Adımlarının yere değişini hisset. Telefon cebinde kalsın; sokak sana yeter."],
      [215, "Gün içinde tek bir derin nefes bile bir dönüş kapısı. Uzun olması gerekmez; hatırlaman yeter."],
      [270, "Yedi gün bitti ama bir şey başladı. Bu sessizliği artık yanında taşıyorsun."],
      [330, "Gözlerini aç. Kendi hızında devam et. Yolun açık olsun."],
    ],
  },
  {
    id: "m20", cat: "stres", title: "Bir Nefeslik Mola", dur: 4, sound: "rain", premium: false,
    lines: [
      [0, "Olduğun yerde kal. Gözlerini kapatman gerekmiyor; bakışını yumuşat, tek bir noktaya sabitleme."],
      [25, "Ayak tabanlarını fark et. Zemin seni taşıyor; ağırlığını iki ayağına eşit dağıt."],
      [50, "Derin bir nefes al… burnundan. Ve yavaşça ver. Çenendeki gerginliği bırak."],
      [80, "Omuzlarını kulaklarına doğru hafifçe kaldır… ve bırak düşsünler. Bir kez daha."],
      [115, "Etraftaki sesler gelip geçsin. Sen sadece nefesinin girip çıkışını izle. Hepsi bu."],
      [155, "Bu bekleyiş bir kayıp değil; sana kalan küçük bir boşluk. O boşluğun içinde dur."],
      [205, "Bir nefes daha al. Hazır olduğunda günün akışına, biraz daha hafif, geri dön."],
    ],
  },
  {
    id: "m21", cat: "kaygi", title: "Sahne Öncesi Nefes", dur: 5, sound: "ocean", premium: true,
    lines: [
      [0, "Bir yer bul; dik ama rahat otur ya da ayakta dur. Gözlerini kapatabilirsin."],
      [25, "Kalbin hızlı atıyorsa sorun yok. Bedenin önemli bir an için hazırlanıyor; bu bir alarm değil, bir hazırlık."],
      [50, "Burnundan dört sayarak nefes al… bir, iki, üç, dört. Altı sayarak ver. Veriş, alıştan uzun olsun."],
      [78, "Bir kez daha. Alırken göğsün genişlesin… verirken omuzların yumuşasın."],
      [108, "Avuçlarını fark et. Belki hafif terli, belki serin. Onları bir kez sık… ve aç. Enerji orada, senin emrinde."],
      [140, "Şimdi o anı gözünün önüne getir. İçeri giriyorsun; adımların yavaş, nefesin seninle."],
      [175, "İlk cümleni söylediğini hayal et. Sesin titrese bile devam ediyorsun. Devam etmek yeterli."],
      [215, "İçindeki bu kıpırtıya yeni bir ad ver: heyecan. Aynı enerji; sadece yönü artık sana ait."],
      [260, "Son bir derin nefes. Hazırsın. Gözlerini aç ve o ana kendi temponla yürü."],
    ],
  },
  {
    id: "m22", cat: "uyku", title: "Ondan Geriye", dur: 7, sound: "rain", premium: true,
    lines: [
      [0, "Yatağına yerleş. Yorganın ağırlığını, başının yastıkta bıraktığı izi hisset."],
      [30, "Birazdan ondan geriye sayacağız. Her sayıda bedenin biraz daha ağırlaşacak, zihnin biraz daha yavaşlayacak."],
      [60, "On… Nefesin kendi ritmini bulsun. Dokuz… Alnındaki çizgiler yumuşasın."],
      [95, "Sekiz… Göz kapakların ağırlaşıyor. Yedi… Çenen gevşiyor, dişlerin birbirine değmiyor."],
      [130, "Altı… Omuzların yatağa gömülüyor. Beş… Kolların ağır, sıcak, sakin."],
      [170, "Dört… Yağmurun sesi düşüncelerinin arasını dolduruyor. Boşluklar büyüyor."],
      [215, "Üç… Bacakların, gün boyu taşıdıkları her şeyi bırakıyor."],
      [260, "İki… Düşünceler uzaktan geçen ışıklar gibi; bakmana gerek yok."],
      [310, "Bir… Artık hiçbir yere gitmen gerekmiyor. Tam olman gereken yerdesin."],
      [365, "Sayılar bitti. Sadece nefes, yağmur ve ağırlık kaldı. Kendini gecenin akışına bırakabilirsin."],
    ],
  },
  {
    id: "m23", cat: "uyku", title: "Günü Rafa Kaldır", dur: 6, sound: "wind", premium: false,
    lines: [
      [0, "Uzan ve gözlerini kapat. Bugün her neyse, olduğu gibi kalsın; şimdi sadece kapanış vakti."],
      [28, "Rüzgârın sesini duy. Gün boyu biriken ne varsa, o ses gibi gelip geçmesine izin ver."],
      [56, "Zihninde sessiz bir oda hayal et. Duvarlarında boş, geniş raflar var."],
      [88, "Bugünden bir an seç. İyi ya da kötü demeden, onu elinde bir nesne gibi tut… ve rafa koy."],
      [120, "Bir an daha. Yarım kalan bir iş belki. Yargılamadan, olduğu gibi… rafa."],
      [158, "Söylenmemiş bir söz, küçük bir sevinç, bir yorgunluk… Hepsine rafta yer var."],
      [200, "Raflar sabaha kadar bekleyebilir. Hiçbiri kaybolmayacak; sadece bu gece taşınmayacaklar."],
      [245, "Odanın ışığını yavaşça kıs. Kapıyı usulca örtüyorsun; gün tamamlandı."],
      [295, "Şimdi sadece nefesin ve rüzgâr var. Bırak, gece seni taşısın."],
    ],
  },
  {
    id: "m24", cat: "odak", title: "Işığı Topla", dur: 4, sound: "white", premium: true,
    lines: [
      [0, "Otur ve omurganı nazikçe dikleştir. Bir derin nefes al… ve ver."],
      [25, "Dikkatin şu an dağınık olabilir. Sorun değil; dağılan şey toplanabilir."],
      [50, "Güneş ışığının bir mercekle tek noktada toplandığını düşün. Işık aynı ışık; sadece bir araya geliyor."],
      [80, "Şimdi merceğin nefesin. Her nefes alışta, dağılan dikkatinin bir parçası geri geliyor."],
      [115, "Zihnin başka yere kayarsa fark et, kızma. Merceği hafifçe çevir; ışık yeniden toplansın."],
      [160, "O tek parlak nokta, birazdan döneceğin iş. Şu an sadece o var; gerisi kenarda bekleyebilir."],
      [205, "Bir nefes daha. Gözlerini aç ve o tek noktaya, toplanmış ışığınla dön."],
    ],
  },
  {
    id: "m25", cat: "ozguven", title: "İç Sesin Adı", dur: 5, sound: "selale", premium: true,
    lines: [
      [0, "Rahatça otur. Şelalenin sesi aksın; sen sadece nefesinle burada ol."],
      [25, "Az önce bir şey ters gitti. Bunu değiştirmeye çalışmadan, sadece 'oldu' de. Olan, oldu."],
      [52, "İçinde konuşan sert bir ses olabilir. 'Nasıl yaparsın' diyen ses. Onu şimdi dinleme; sadece fark et."],
      [80, "O sese bir ad ver. Herhangi bir ad. Ad koyduğun şey, sen olmaktan çıkar; misafire dönüşür."],
      [110, "Misafirin söyledikleri birer duygu, kanıt değil. Kanıtlara birlikte bakalım."],
      [145, "Daha önce zor bir durumu toparladığın bir anı hatırla. Bir tane yeter. Onu gözünün önünde tut."],
      [182, "O gün de hata olmuştu belki. Ama devam ettin. Hata bir olaydı; sen olayların toplamısın."],
      [222, "Misafire içinden şunu söyle: 'Seni duydum. Ama bugün kararları ben veriyorum.'"],
      [262, "Derin bir nefes al. Omuzlarını geri aç, başını kaldır. Kaldığın yerden, bir adım."],
    ],
  },
  {
    id: "m26", cat: "iliskiler", title: "Sadece Duymak", dur: 5, sound: "forest", premium: true,
    lines: [
      [0, "Rahat bir pozisyon al. Sırtın dik ama yumuşak olsun. Gözlerini kapatabilirsin."],
      [25, "Bir nefes al… ve yavaşça bırak. Şu an sadece buradasın."],
      [50, "Çevrendeki sesleri fark et. Onları adlandırmadan, sadece duy."],
      [80, "Şimdi birini düşün. Onu dinlerken aklın çoğu zaman cevabını hazırlıyor. Bunu fark etmen yeterli."],
      [110, "Cevabı bırak. İçinden şunu de: Şu an sadece duyuyorum."],
      [145, "O kişinin sesini hayal et. Kelimelerin altındaki tonu dinle. Acele etmeden."],
      [185, "Dinlemek bir hediye. Karşındakine yer açtığında, kendine de yer açıyorsun."],
      [230, "Bir nefes daha al. Bu sessiz dinleme alanı hep seninle."],
      [275, "Hazır olduğunda gözlerini yavaşça aç. Bugün birini sadece duymak için dinle."],
    ],
  },
  {
    id: "m27", cat: "iliskiler", title: "Dalganın Götürdüğü", dur: 6, sound: "ocean", premium: false,
    lines: [
      [0, "Otur ya da uzan. Bedeninin desteklendiği yerleri hisset."],
      [25, "Derin bir nefes al… ve bırak. Omuzların yumuşasın."],
      [50, "Dalgaların sesi gibi, nefesin de gelip gidiyor. Onu izle."],
      [80, "Şimdi nazikçe bir kırgınlığı hatırla. Küçük bir tanesini seç. Zorlamadan."],
      [110, "Bu kırgınlık bedeninde nerede? Göğsünde bir baskı, boğazında bir düğüm olabilir. Sadece fark et."],
      [145, "Bu ağırlığı uzun süredir taşıyorsun. Taşımak bir seçimdi; bırakmak da olabilir."],
      [185, "Bırakmak, olanı onaylamak değil. Sadece elini açmak. Kendi omzunu hafifletmek."],
      [230, "Nefes verirken ağırlığın bir kısmının aktığını hayal et. Dalga geri çekilirken kumdaki izleri alıp götürür gibi."],
      [280, "Tamamı gitmese de olur. Bugün bir avuç bıraktın; bu yeterli."],
      [330, "Yavaşça parmaklarını kıpırdat. Gözlerini aç. Biraz daha hafifsin."],
    ],
  },
  {
    id: "m28", cat: "ofke", title: "İzleyen Kıyı", dur: 4, sound: "fire", premium: true,
    lines: [
      [0, "Dur. Ayaklarını yere bas. Bir nefes al."],
      [25, "Öfke bir dalga gibi yükseliyor olabilir. Onunla savaşma; sadece izle."],
      [50, "Bedeninde sıcaklığı ara. Göğsünde mi, ellerinde mi, yüzünde mi? Bulduğun yere nefes gönder."],
      [80, "Bu sıcaklık bir bilgi. Sana önemli bir şeye dokunulduğunu söylüyor. Onu duydun."],
      [115, "Nefes verişini uzat. İçeri dört say… dışarı altı say. Alevin köze dönmesini izle."],
      [160, "Dalga yükseldi ve şimdi iniyor. Sen dalga değilsin; onu izleyen kıyısın."],
      [210, "Bir nefes daha. Hazır olduğunda gözlerini aç. Ne yapacağını artık sen seçiyorsun."],
    ],
  },
  {
    id: "m29", cat: "sukran", title: "Üç Küçük An", dur: 4, sound: "forest", premium: true,
    lines: [
      [0, "Rahatça otur. Gözlerini kapat. Bir nefes al ve bırak."],
      [20, "Bugünün içinde küçük iyilikler saklı. Şimdi onları toplamaya çıkıyorsun."],
      [45, "İlk anı bul. Belki sıcak bir bardak, bir gülümseme, pencereden düşen ışık. Onu yeniden gör."],
      [75, "O anda bedenin nasıldı? O küçük rahatlığı şimdi tekrar hisset."],
      [110, "İkinci anı çağır. Sıradan görünen ama iyi gelen bir şey. Yanında biraz kal."],
      [155, "Ve üçüncüsü. Küçücük olabilir. Onu avucuna al, ağırlığını hisset. Üç an; bugünün sessiz hazinesi."],
      [205, "Bu anlar hep oradaydı; sen fark ettin. Gözlerini açtığında bir tane daha bulabilirsin."],
    ],
  },
  {
    id: "m30", cat: "sefkat", title: "İçindeki Dost", dur: 5, sound: "rain", premium: true,
    lines: [
      [0, "Otur ve bedeninin yerleştiğini hisset. Yağmurun sesi arka planda kalsın."],
      [25, "Bir elini göğsüne koyabilirsin. Avucunun sıcaklığını fark et."],
      [50, "Bugün zordu. Bunu kabul etmek için büyük bir sebep gerekmiyor. Zordu, o kadar."],
      [80, "Şimdi en yakın dostunu düşün. Aynı günü o yaşasaydı, ona ne derdin?"],
      [110, "Muhtemelen yumuşak bir şey derdin. Suçlamazdın. Acele ettirmezdin."],
      [145, "O cümleyi şimdi kendine söyle. İçinden, kendi adınla: Bugün elinden geleni yaptın."],
      [185, "Kendine dostluk göstermek bencillik değil. Aynı anlayışı içeri döndürmek."],
      [230, "Avucunun altındaki sıcaklık… O dost sensin. Hep yanındaydın."],
      [275, "Yavaşça derin bir nefes al. Gözlerini aç. Kendine biraz daha yumuşak davranarak devam et."],
    ],
  },
];

/* Uyku hikayeleri — özgün kısa hikayeler
   Kural: her gün 1 hikaye ücretsizdir (rotasyon), diğerleri Premium ister. */
const STORIES = [
  {
    id: "s1", title: "Fener Bekçisinin Gecesi", dur: 10, sound: "ocean", emoji: "🗼",
    lines: [
      [0,   "Küçük bir adada, taş bir fenerin en üst katında yaşlı bekçi Halil oturuyordu."],
      [45,  "Deniz bu gece sakindi. Dalgalar kayalara fısıltıyla dokunup geri çekiliyordu."],
      [100, "Halil, fenerin ışığını yaktı. Işık, karanlık denizin üzerinde yavaş yavaş döndü."],
      [160, "Uzakta bir balıkçı teknesi, ışığı görünce rotasını düzeltti ve limana yöneldi."],
      [220, "Halil termosundan ıhlamurunu doldurdu. Buhar, gaz lambasının ışığında dans etti."],
      [290, "Rüzgâr, fenerin taşlarına eski bir ninni gibi sürtünüyordu."],
      [360, "Bekçi pencereden baktı: gökyüzünde yıldızlar, denizde onların yansımaları."],
      [430, "\"Bu gece de herkes evine ulaştı,\" diye mırıldandı. Gözkapakları ağırlaştı."],
      [500, "Fener dönmeye devam etti. Ada uyudu, deniz uyudu, Halil uyudu."],
      [560, "Ve ışık, uyuyan herkes için nöbetteydi…"],
    ],
  },
  {
    id: "s2", title: "Kar Altındaki Köy", dur: 9, sound: "wind", emoji: "🏔️",
    lines: [
      [0,   "Dağların arasındaki küçük köye akşamla birlikte kar başladı."],
      [50,  "Kar taneleri, sokak lambasının ışığında ağır ağır süzülüyordu."],
      [110, "Evlerin bacalarından incecik dumanlar yükseliyor, camlardan turuncu ışıklar sızıyordu."],
      [180, "Fırıncı Ayşe, son ekmekleri kara komşusuna bıraktı ve kepengini indirdi."],
      [250, "Köyün kedisi Duman, samanlıktaki sıcak köşesine kıvrıldı."],
      [320, "Kar, çatıları, yolları, çitleri yumuşacık bir yorgan gibi örttü."],
      [390, "Ses diye bir şey kalmadı; sadece karın sessizliği."],
      [460, "Köy, beyaz yorganın altında derin bir uykuya daldı…"],
    ],
  },
  {
    id: "s3", title: "Gece Treni", dur: 11, sound: "rain", emoji: "🚂",
    lines: [
      [0,   "Tren, yağmurlu ovada usulca ilerliyordu. Vagonlar neredeyse boştu."],
      [55,  "Cam kenarındaki koltukta oturuyorsun. Cama vuran damlalar yol çiziyor."],
      [120, "Tekerleklerin ritmi hiç değişmiyor: tık-tık… tık-tık…"],
      [190, "Kondüktör geçti, sana battaniye uzattı ve ışığı kıstı."],
      [260, "Dışarıda uzak kasabaların ışıkları birer birer geride kalıyor."],
      [340, "Nereye gittiğin önemli değil; tren seni güvenle taşıyor."],
      [420, "Battaniyenin altında ısındıkça gözlerin kapanıyor."],
      [500, "Tık-tık… tık-tık… Yağmur, ritim ve sen."],
      [570, "Tren gecenin içinde, sen uykunun içinde yol alıyorsunuz…"],
    ],
  },
  {
    id: "s4", title: "Zeytin Ağacının Rüyası", dur: 8, sound: "forest", emoji: "🫒",
    lines: [
      [0,   "Ege'de bir tepede, sekiz yüz yaşında bir zeytin ağacı vardı."],
      [50,  "Akşam güneşi gövdesindeki kıvrımları altına boyadı."],
      [115, "Ağaç, sekiz yüz yılın bütün baharlarını hatırlıyordu."],
      [185, "Cırcır böcekleri geceye başladı. Yapraklar hafif rüzgârda fısıldaştı."],
      [255, "Kökleri toprağın derinliklerinde, serin sularla buluşuyordu."],
      [325, "Ağacın gölgesinde bir çoban köpeği kıvrılmış, uyuyordu."],
      [395, "Yıldızlar tek tek açtı. Ağaç, dallarını gökyüzüne bıraktı."],
      [450, "Ve sekiz yüz yıllık sabırla, yeni bir rüyaya daldı…"],
    ],
  },
  {
    id: "s5", title: "Çiftlikte Akşam", dur: 9, sound: "ciftlik", emoji: "🐄",
    lines: [
      [0,   "Güneş, tepelerin ardına altın bir yorgunlukla iniyordu. Çiftlikte akşam vakti."],
      [50,  "İnekler ahıra doğru ağır adımlarla yürüdü; boyunlarındaki çanlar usul usul çınladı."],
      [115, "Keçiler son bir kez oyunlaştı, sonra samanların arasına yerleşti."],
      [185, "Çiftçi Osman, ahırın kapısını örttü. \"İyi geceler,\" dedi hayvanlarına, her akşamki gibi."],
      [255, "Kümesin önünde tavuklar çoktan sıraya dizilmiş, tüylerini kabartmıştı."],
      [320, "Uzaktan bir dere sesi geliyordu; gündüzün bütün telaşını alıp götürüyordu."],
      [390, "Gökyüzünde ilk yıldız göründü. Ahırdan derin, sıcak nefes sesleri yükseliyordu."],
      [460, "Çiftlik, toprağın kokusuyla sarınıp uykuya daldı…"],
    ],
  },
  {
    id: "s6", title: "Yıldız Haritacısı", dur: 10, sound: "wind", emoji: "🌌",
    lines: [
      [0, "Dağın tepesindeki küçük gözlemevinde ışıklar kısıktı. Defne, yün hırkasını omuzlarına alıp teleskobun başına geçti."],
      [55, "Dışarıda rüzgâr, çam dallarının arasından yumuşak bir uğultuyla geçiyordu. İçeride ise yalnızca kalemin kağıda değen sesi vardı."],
      [115, "Defne o gece haritasına yeni bir yıldız işledi. Küçük, sabırlı bir nokta; mürekkep yavaşça kurudu."],
      [175, "Termostan bardağına tarçınlı çay doldurdu. Buhar, soğuk camın önünde ince bir bulut gibi yükseldi."],
      [235, "Gökyüzü açık ve derindi. Samanyolu, dağların üzerine dökülmüş gümüş bir toz gibi uzanıyordu."],
      [300, "Teleskobun içinden bakınca her şey yavaşlıyordu. Yıldızlar acele etmiyordu; Defne de etmedi."],
      [365, "Haritanın kenarına küçük notlar aldı. Sonra kalemi bıraktı, ellerini sıcak bardağın çevresine sardı."],
      [430, "Rüzgâr kubbenin etrafında dönüyor, gözlemevini bir ninni gibi sarıyordu. Defne göz kapaklarının ağırlaştığını hissetti."],
      [495, "Haritayı özenle rulo yaptı, ince bir kurdeleyle bağladı. Bu gece yeterince yıldız saymıştı."],
      [560, "Battaniyesine sarılıp pencerenin yanındaki koltuğa kıvrıldı. Gökyüzü ona göz kırptı, o da gökyüzüne… ve kendini yavaşça uykuya bıraktı…"],
    ],
  },
  {
    id: "s7", title: "Sahafın Işığı", dur: 9, sound: "rain", emoji: "📚",
    lines: [
      [0, "Yağmur, sahaf dükkanının camına ince ince vuruyordu. Halil Bey, kapıdaki tabelayı 'Kapalı' yüzüne çevirdi."],
      [50, "İçeride eski kağıdın ve ahşap rafların o tanıdık kokusu vardı. Sarı abajur, kitap sırtlarına bal rengi bir ışık düşürüyordu."],
      [105, "Halil Bey gün boyu yerinden oynamış kitapları tek tek yerlerine koydu. Her cilt, rafına yerleşirken hafif bir iç çekiş gibi ses çıkardı."],
      [165, "Camdaki damlalar birbirine karışıp ince yollar çiziyordu. Sokak lambasının ışığı, damlaların içinde küçük küçük parlıyordu."],
      [225, "Tezgahın üstünde yarım kalmış bir fincan ıhlamur duruyordu. Halil Bey bir yudum aldı; hâlâ ılıktı."],
      [290, "Kedisi Sümbül, ansiklopedilerin üstündeki minderinde kıvrılmıştı. Kuyruğu, uykusunda ağır ağır sallanıyordu."],
      [355, "Halil Bey en sevdiği koltuğa oturdu, dizine eski bir atlas aldı. Sayfaları çevirmedi bile; yalnızca kapağının dokusunu dinledi."],
      [425, "Yağmurun sesi inceldi, dükkanın içi iyice yumuşadı. Raflar, kitaplar, gölgeler; hepsi aynı sessizliğe karıştı."],
      [495, "Halil Bey abajuru kıstı, gözleri usulca kapandı. Dışarıda yağmur, içeride kitaplar; her şey yerli yerindeydi… gece kendi sayfasını yavaşça kapattı…"],
    ],
  },
  {
    id: "s8", title: "Göl Evinde Yaz Gecesi", dur: 8, sound: "forest", emoji: "🛶",
    lines: [
      [0, "Göl kıyısındaki ahşap evin verandasında akşamın son ışığı sönüyordu. Aylin, çıplak ayaklarıyla iskelenin ılık tahtalarında yürüdü."],
      [50, "Su, iskelenin ayaklarına hafif hafif şıpırdıyordu. Uzakta bir balık, suyun yüzünde halkalar bırakıp kayboldu."],
      [105, "Ağustos böcekleri kıyı boyunca hep bir ağızdan şarkısını sürdürüyordu. Ses, geceye serilmiş yumuşak bir örtü gibiydi."],
      [160, "Aylin iskelenin ucuna oturdu, ayak parmaklarını suya değdirdi. Göl, gündüzden kalan sıcaklığını hâlâ saklıyordu."],
      [220, "Evden çam ve taze ekmek kokusu geliyordu. Pencerede gaz lambasının turuncu ışığı usulca sallanıyordu."],
      [280, "Gökyüzünde yıldızlar tek tek beliriyor, suyun yüzünde titrek kopyaları yüzüyordu."],
      [345, "Aylin eve dönüp verandadaki hamağa uzandı. Battaniye dizlerinde, göl sesleri kulağındaydı."],
      [415, "Hamak ağır ağır sallandı, ağustos böcekleri yavaş yavaş uzaklaştı. Gölün nefesi derinleşti, Aylin'inki de… gece onu yumuşacık kollarına aldı…"],
    ],
  },
  {
    id: "s9", title: "Kervansarayın Avlusu", dur: 10, sound: "fire", emoji: "🏕️",
    lines: [
      [0, "Gün batarken kervan, taş kapılı eski kervansaraya vardı. Kerem, devesinin yularını usulca bağladı ve serin avluya adım attı."],
      [50, "Avlunun ortasında büyük bir ateş yanıyordu. Kıvılcımlar, yıldızlara katılmak ister gibi ağır ağır yükseliyordu."],
      [105, "Yolcular ateşin çevresine minderler sermişti. Kimsenin acelesi yoktu; yol bitmişti, gece başlamıştı."],
      [160, "Bakır çaydanlıkta demlenen çayın kokusu avluya yayıldı. Kerem, sıcak bardağı iki eliyle tuttu."],
      [220, "Çöl göğü baştan başa yıldızla doluydu. Sanki biri koca bir kadife örtüye avuç avuç ışık serpmişti."],
      [285, "Develer avlunun köşesinde çöktü, gözlerini yarı kapattı. Çanlarından ara sıra tek bir yumuşak tını geliyordu."],
      [350, "Yaşlı bir yolcu, alçak sesle uzak şehirlerin çeşmelerini anlatıyordu. Sesi, ateşin çıtırtısına karışıp tatlı bir mırıltıya dönüştü."],
      [420, "Ateş yavaş yavaş kora dönüyordu. Turuncu ışık, taş duvarlarda sallanan gölgeleri gitgide yumuşattı."],
      [490, "Kerem kilimin üzerine uzandı, heybesini başının altına koydu. Taşlar, gündüzün sıcaklığını hâlâ ona veriyordu."],
      [560, "Göğün ortasında kayan bir yıldız ince bir çizgi bıraktı. Kerem gülümsedi, gözleri kapandı… avludaki kor, sabaha dek onun uykusunu bekledi…"],
    ],
  },
  {
    id: "s10", title: "Adanın Bahçıvanı", dur: 11, sound: "ocean", emoji: "🌺",
    lines: [
      [0, "Uzak bir adanın yamacında, denize bakan bir botanik bahçesi vardı. Yaşlı bahçıvan Sabri, akşam sulamasına begonvillerin altından başladı."],
      [50, "Bakır süzgeçli kovadan dökülen su, toprağa değince serin bir koku yükseldi. Sabri bu kokuyu kırk yıldır her akşam yeniden severdi."],
      [105, "Deniz meltemi bahçeye tuz ve yasemin taşıyordu. Yapraklar, esintiyle birbirine değip usul usul fısıldaştı."],
      [160, "Sabri, manolyanın geniş yapraklarını eliyle şöyle bir yokladı. Ağaç, günün sıcağını çoktan bırakmıştı."],
      [220, "Aşağıda dalgalar, kıyı taşlarını sabırla yıkıyordu. Aynı ritim, aynı nefes; yıllardır hiç değişmeden."],
      [280, "Sera camlarında gün batımının son pembeliği duruyordu. İçeride orkideler, ılık ve nemli havada sessizce dinleniyordu."],
      [345, "Sabri son kovayı gül fidanlarına döktü. Su damlaları, yaprak uçlarında minik fenerler gibi asılı kaldı."],
      [410, "Taş yolun kenarındaki banka oturdu, hasır şapkasını yanına koydu. Derin bir nefes aldı; iyi bir gündü."],
      [480, "Ada yavaş yavaş lacivert bir örtüye büründü. İlk yıldız, uzaktaki deniz fenerinin ışığıyla selamlaştı."],
      [550, "Meltem serinledi, çiçek kokuları koyulaştı. Bahçe, gece çiçeklerinin sessiz nöbetine geçti."],
      [620, "Sabri bahçe evinin verandasındaki şezlonga uzandı, battaniyesini çekti. Dalgaları saydı; bir, iki, üç… ve sayılar, uykunun içinde çiçeklere karıştı…"],
    ],
  },
];

/* Nefes egzersizleri */
const BREATHS = [
  { id: "b478", name: "4-7-8 Uyku Nefesi", desc: "Uykudan önce sinir sistemini yavaşlatır", inhale: 4, hold: 7, exhale: 8, hold2: 0, cycles: 4, emoji: "😴" },
  { id: "bbox", name: "Kutu Nefesi", desc: "Odak ve sakinlik için 4-4-4-4", inhale: 4, hold: 4, exhale: 4, hold2: 4, cycles: 5, emoji: "📦" },
  { id: "bcalm", name: "Sakinleşme Nefesi", desc: "Uzun verişle anında rahatlama", inhale: 4, hold: 0, exhale: 6, hold2: 0, cycles: 6, emoji: "🍃" },
];

/* Sesler — WebAudio ile sentezlenir, telif yok. Karışım masasında birlikte çalınabilir. */
const SOUNDS = [
  { id: "rain",    name: "Yağmur",        icon: "rain" },
  { id: "ocean",   name: "Okyanus",       icon: "ocean" },
  { id: "selale",  name: "Şelale",        icon: "waterfall" },
  { id: "ciftlik", name: "Çiftlik",       icon: "farm" },
  { id: "wind",    name: "Rüzgâr",        icon: "wind" },
  { id: "fire",    name: "Şömine",        icon: "fire" },
  { id: "forest",  name: "Gece Ormanı",   icon: "forest" },
  { id: "white",   name: "Beyaz Gürültü", icon: "radio" },
  { id: "brown",   name: "Kahverengi Gürültü", icon: "noise" },
  { id: "pink",    name: "Pembe Gürültü", icon: "noise" },
  { id: "f174",    name: "174 Hz Dinginlik", icon: "tone" },
  { id: "f432",    name: "432 Hz Uyum",   icon: "tone" },
];

/* Günün sözleri — özgün */
const QUOTES = [
  "Nefesin, her zaman yanında taşıdığın bir eve açılan kapıdır.",
  "Zihnin bir gökyüzü; düşünceler sadece geçen bulutlar.",
  "Bugün yapabileceğin en cesur şey, durup dinlenmek olabilir.",
  "Fırtınayı durduramazsın ama limanını kendi içinde kurabilirsin.",
  "Küçük bir mola, büyük bir devam ediştir.",
  "Kendine bir dostuna davrandığın gibi davran; o dostu hak ediyorsun.",
  "Uyku, yarına yazılmış en nazik mektuptur.",
  "Aceleyle geçen bir gün değil, fark ederek geçen bir an zenginliktir.",
  "Sakinlik bir yetenek değil, her gün sulanan bir bahçedir.",
  "Şu an buradasın; bu, başlamak için yeterli.",
  "Bırakmak kaybetmek değildir; ellerini yeni şeyler için boşaltmaktır.",
  "En derin sessizlik, iki nefes arasındaki o küçük boşluktadır.",
  "Yorgunluğunu kabul etmek de bir güç gösterisidir.",
  "Gökyüzüne bak: bu kadar genişlik, senin içinde de var.",
];

/* Yolculuklar / programlar — days: MEDITATIONS id listesi (sırayla) */
const PROGRAMS = [
  {
    id: "p7giris", title: "7 Günde Meditasyona Giriş", emoji: "🌄", tag: "YOLCULUK",
    desc: "Hiç yapmadıysan buradan başla — her gün yeni bir beceri",
    days: ["m13", "m14", "m15", "m16", "m17", "m18", "m19"],
  },
  {
    id: "pstres", title: "Stresi Bırak", emoji: "🍃", tag: "PROGRAM",
    desc: "5 seansta gerginliği tanı, gevşet, bırak",
    days: ["m20", "m1", "m2", "m28", "m11"],
  },
];

/* Toplu seanslar — senkronu saat sağlar: herkes aynı dakikada aynı içerikte.
   taban: katılımcı sayacının çekirdeği (v2'de gerçek sayaca bağlanacak) */
const TOPLU_SEANSLAR = [
  { id: "sabah", saat: "08:00", ad: "Güne Birlikte Başla", emoji: "☀️", icerik: "m11", taban: 1140 },
  { id: "ogle",  saat: "13:00", ad: "Öğle Molası",         emoji: "🍃", icerik: "m20", taban: 720 },
  { id: "gece",  saat: "22:00", ad: "Ay Işığı Seansı",     emoji: "🌕", icerik: "m22", taban: 3080 },
];

/* Rozetler — koşullar app.js/checkBadges içinde */
const BADGES = [
  { id: "ilkadim",  emoji: "🌱", name: "İlk Adım",    desc: "İlk seansını tamamla" },
  { id: "seri3",    emoji: "🔥", name: "3 Gün Seri",  desc: "3 gün üst üste seans yap" },
  { id: "seri7",    emoji: "⚡", name: "7 Gün Seri",  desc: "Bir hafta aralıksız" },
  { id: "seri30",   emoji: "🏆", name: "30 Gün Seri", desc: "Bir ay aralıksız" },
  { id: "saat1",    emoji: "⏳", name: "1 Saat",      desc: "Toplam 60 dakika tamamla" },
  { id: "saat10",   emoji: "🌟", name: "10 Saat",     desc: "Toplam 600 dakika tamamla" },
  { id: "gecekusu", emoji: "🦉", name: "Gece Kuşu",   desc: "22:00'den sonra bir seans yap" },
  { id: "erkenkus", emoji: "🐦", name: "Erken Kuş",   desc: "08:00'den önce bir seans yap" },
  { id: "kasif",    emoji: "🧭", name: "Kâşif",       desc: "5 farklı kategoriden seans yap" },
  { id: "yolcu",    emoji: "🎒", name: "Yolcu",       desc: "Bir yolculuğu baştan sona bitir" },
];
