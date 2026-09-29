/**
 * РЕАЛЬНЫЕ МЕДИА САЙТА — сгенерировано из данных 2ГИС и Instagram.
 *
 * Источники:
 *  • 2ГИС, карточка QuestHouse Fantom & KinoLand (id 70000001112974709):
 *    45 фото + 17 видео. Скачаны локально в /public/media.
 *  • Instagram @fantom_uka_: 12 публикаций + аватар.
 *
 * Файлы с ценами, расписаниями, скриншотами и коллажами с текстом
 * в подборку НЕ входят — это видно в public/media/classification.json.
 *
 * Файл сгенерирован; правьте осознанно — данные должны оставаться
 * сверяемыми с источниками (см. README).
 */

export type Orientation = "portrait" | "landscape" | "square";

export type Photo = {
  readonly src: string;
  readonly alt: string;
  readonly orientation: Orientation;
  readonly source: "2GIS" | "Instagram";
};

export type VideoClip = {
  readonly poster: string;
  /** HLS-поток 2ГИС. Проигрывается через hls.js, подключается по клику. */
  readonly hls: string;
  readonly duration: number;
  readonly orientation: Orientation;
  readonly title: string;
};

// Фон первого экрана: роспись «Теория зла» во всю стену.
export const HERO_PHOTO: Photo = {
  src: "/media/2gis/2gis-31.jpg",
  alt: "Роспись FANTOM «Теория зла» во всю стену с красным неоном и полом в терраццо.",
  orientation: "landscape",
  source: "2GIS",
};

/** Обложка и галерея для каждой комнаты. */
export const QUEST_MEDIA: Record<string, { cover: Photo; gallery: Photo[] }> = {
  "sanatorium": {
    cover: {"src":"/media/2gis/2gis-37.jpg","alt":"Комната с росписью FANTOM «Теория зла», красным неоном по потолку и полом в терраццо.","orientation":"portrait","source":"2GIS"},
    gallery: [
      {"src":"/media/2gis/2gis-37.jpg","alt":"Комната с росписью FANTOM «Теория зла», красным неоном по потолку и полом в терраццо.","orientation":"portrait","source":"2GIS"},
      {"src":"/media/2gis/2gis-25.jpg","alt":"Стена с росписью FANTOM «Теория зла» со скелетом-демоном в розовом неоне, пол в терраццо.","orientation":"portrait","source":"2GIS"},
      {"src":"/media/2gis/2gis-13.jpg","alt":"Актёр в маске клоуна в полный рост в красной комнате с книжной полкой и дверью.","orientation":"portrait","source":"2GIS"},
      {"src":"/media/2gis/2gis-22.jpg","alt":"Красный неоновый логотип FANTOM по центру кадра на тёмно-красной стене.","orientation":"portrait","source":"2GIS"},
    ],
  },
  "basement": {
    cover: {"src":"/media/2gis/2gis-06.jpg","alt":"Угол комнаты с росписью FANTOM «Теория зла», когтистой лапой, красной неоновой линией и плиточным полом.","orientation":"portrait","source":"2GIS"},
    gallery: [
      {"src":"/media/2gis/2gis-06.jpg","alt":"Угол комнаты с росписью FANTOM «Теория зла», когтистой лапой, красной неоновой линией и плиточным полом.","orientation":"portrait","source":"2GIS"},
      {"src":"/media/2gis/2gis-21.jpg","alt":"Крупный фрагмент росписи FANTOM «Теория зла» в розово-фиолетовом свете.","orientation":"portrait","source":"2GIS"},
      {"src":"/media/2gis/2gis-05.jpg","alt":"Актёр в маске клоуна в красном свете на фоне стены с рамками тёмных фото.","orientation":"portrait","source":"2GIS"},
      {"src":"/media/2gis/2gis-28.jpg","alt":"Красный неоновый логотип FANTOM по центру в тёмной комнате.","orientation":"portrait","source":"2GIS"},
    ],
  },
  "wardrobe": {
    cover: {"src":"/media/2gis/2gis-38.jpg","alt":"Интерьер: красный неон и роспись FANTOM с демоном на стене, диван и пакет с покупками в кадре.","orientation":"portrait","source":"2GIS"},
    gallery: [
      {"src":"/media/2gis/2gis-38.jpg","alt":"Интерьер: красный неон и роспись FANTOM с демоном на стене, диван и пакет с покупками в кадре.","orientation":"portrait","source":"2GIS"},
      {"src":"/media/2gis/2gis-30.jpg","alt":"Крупный кадр росписи стены FANTOM «Теория зла» в фиолетовом неоне.","orientation":"portrait","source":"2GIS"},
      {"src":"/media/2gis/2gis-11.jpg","alt":"Крупный план актёра в маске клоуна в красном свете, рядом полка с книгами и предметами.","orientation":"portrait","source":"2GIS"},
      {"src":"/media/2gis/2gis-32.jpg","alt":"Неоновый логотип FANTOM на тёмной стене комнаты.","orientation":"portrait","source":"2GIS"},
    ],
  },
  "ward-13": {
    cover: {"src":"/media/2gis/2gis-16.jpg","alt":"Актёр в образе «монахини» в тёмном кадре с красной подсветкой у кирпичной стены с картиной-крестом.","orientation":"portrait","source":"2GIS"},
    gallery: [
      {"src":"/media/2gis/2gis-16.jpg","alt":"Актёр в образе «монахини» в тёмном кадре с красной подсветкой у кирпичной стены с картиной-крестом.","orientation":"portrait","source":"2GIS"},
      {"src":"/media/2gis/2gis-17.jpg","alt":"Полуосвещённое лицо актёра-«монахини» в темноте; на стене слева светящийся крест.","orientation":"portrait","source":"2GIS"},
      {"src":"/media/instagram/ig-03.jpg","alt":"Актёр в образе «монахини» (Valak) в полный рост в синем свете.","orientation":"portrait","source":"Instagram"},
      {"src":"/media/2gis/2gis-39.jpg","alt":"Крупный кадр росписи FANTOM «Теория зла» в розово-красном свете.","orientation":"portrait","source":"2GIS"},
    ],
  },
  "attic": {
    cover: {"src":"/media/2gis/2gis-08.jpg","alt":"Чёрная стена с росписью FANTOM «Теория зла», красным неоном по потолку и полом в терраццо.","orientation":"portrait","source":"2GIS"},
    gallery: [
      {"src":"/media/2gis/2gis-08.jpg","alt":"Чёрная стена с росписью FANTOM «Теория зла», красным неоном по потолку и полом в терраццо.","orientation":"portrait","source":"2GIS"},
      {"src":"/media/2gis/2gis-33.jpg","alt":"Роспись стены FANTOM «Теория зла» с захватом пола в терраццо в нижней части кадра.","orientation":"landscape","source":"2GIS"},
      {"src":"/media/2gis/2gis-15.jpg","alt":"Группа детей фотографируется с актёром в маске клоуна на фоне неонового логотипа FANTOM.","orientation":"portrait","source":"2GIS"},
      {"src":"/media/2gis/2gis-26.jpg","alt":"Неоновая вывеска FANTOM на стене, рядом на полке лежат маска и бутылка.","orientation":"portrait","source":"2GIS"},
    ],
  },
  "foyer": {
    cover: {"src":"/media/2gis/2gis-20.jpg","alt":"Стена с росписью FANTOM «Теория зла» в фиолетово-розовом неоновом свете, пол в терраццо.","orientation":"portrait","source":"2GIS"},
    gallery: [
      {"src":"/media/2gis/2gis-20.jpg","alt":"Стена с росписью FANTOM «Теория зла» в фиолетово-розовом неоновом свете, пол в терраццо.","orientation":"portrait","source":"2GIS"},
      {"src":"/media/2gis/2gis-31.jpg","alt":"Роспись FANTOM «Теория зла» во всю стену с красным неоном и полом в терраццо.","orientation":"landscape","source":"2GIS"},
      {"src":"/media/2gis/2gis-23.jpg","alt":"Компания подростков позирует в обнимку на фоне росписи FANTOM с демоном.","orientation":"landscape","source":"2GIS"},
      {"src":"/media/2gis/2gis-40.jpg","alt":"Роспись «Quest Room FANTOM» с демоном в лобби, слева в кадр попала рука человека.","orientation":"portrait","source":"2GIS"},
    ],
  },
};

/** Общая галерея: интерьер, актёры, неоновые вывески. */
export const GALLERY: Photo[] = [
  {"src":"/media/2gis/2gis-31.jpg","alt":"Роспись FANTOM «Теория зла» во всю стену с красным неоном и полом в терраццо.","orientation":"landscape","source":"2GIS"},
  {"src":"/media/2gis/2gis-20.jpg","alt":"Стена с росписью FANTOM «Теория зла» в фиолетово-розовом неоновом свете, пол в терраццо.","orientation":"portrait","source":"2GIS"},
  {"src":"/media/2gis/2gis-06.jpg","alt":"Угол комнаты с росписью FANTOM «Теория зла», когтистой лапой, красной неоновой линией и плиточным полом.","orientation":"portrait","source":"2GIS"},
  {"src":"/media/2gis/2gis-08.jpg","alt":"Чёрная стена с росписью FANTOM «Теория зла», красным неоном по потолку и полом в терраццо.","orientation":"portrait","source":"2GIS"},
  {"src":"/media/2gis/2gis-37.jpg","alt":"Комната с росписью FANTOM «Теория зла», красным неоном по потолку и полом в терраццо.","orientation":"portrait","source":"2GIS"},
  {"src":"/media/2gis/2gis-25.jpg","alt":"Стена с росписью FANTOM «Теория зла» со скелетом-демоном в розовом неоне, пол в терраццо.","orientation":"portrait","source":"2GIS"},
  {"src":"/media/2gis/2gis-21.jpg","alt":"Крупный фрагмент росписи FANTOM «Теория зла» в розово-фиолетовом свете.","orientation":"portrait","source":"2GIS"},
  {"src":"/media/2gis/2gis-30.jpg","alt":"Крупный кадр росписи стены FANTOM «Теория зла» в фиолетовом неоне.","orientation":"portrait","source":"2GIS"},
  {"src":"/media/2gis/2gis-33.jpg","alt":"Роспись стены FANTOM «Теория зла» с захватом пола в терраццо в нижней части кадра.","orientation":"landscape","source":"2GIS"},
  {"src":"/media/2gis/2gis-39.jpg","alt":"Крупный кадр росписи FANTOM «Теория зла» в розово-красном свете.","orientation":"portrait","source":"2GIS"},
  {"src":"/media/2gis/2gis-38.jpg","alt":"Интерьер: красный неон и роспись FANTOM с демоном на стене, диван и пакет с покупками в кадре.","orientation":"portrait","source":"2GIS"},
  {"src":"/media/2gis/2gis-13.jpg","alt":"Актёр в маске клоуна в полный рост в красной комнате с книжной полкой и дверью.","orientation":"portrait","source":"2GIS"},
  {"src":"/media/2gis/2gis-11.jpg","alt":"Крупный план актёра в маске клоуна в красном свете, рядом полка с книгами и предметами.","orientation":"portrait","source":"2GIS"},
  {"src":"/media/2gis/2gis-05.jpg","alt":"Актёр в маске клоуна в красном свете на фоне стены с рамками тёмных фото.","orientation":"portrait","source":"2GIS"},
  {"src":"/media/2gis/2gis-16.jpg","alt":"Актёр в образе «монахини» в тёмном кадре с красной подсветкой у кирпичной стены с картиной-крестом.","orientation":"portrait","source":"2GIS"},
  {"src":"/media/2gis/2gis-17.jpg","alt":"Полуосвещённое лицо актёра-«монахини» в темноте; на стене слева светящийся крест.","orientation":"portrait","source":"2GIS"},
  {"src":"/media/2gis/2gis-23.jpg","alt":"Компания подростков позирует в обнимку на фоне росписи FANTOM с демоном.","orientation":"landscape","source":"2GIS"},
  {"src":"/media/2gis/2gis-03.jpg","alt":"Наружный баннер «Quest Room FANTOM» с изображением демона, закреплённый на кирпичной стене.","orientation":"portrait","source":"2GIS"},
  {"src":"/media/2gis/2gis-22.jpg","alt":"Красный неоновый логотип FANTOM по центру кадра на тёмно-красной стене.","orientation":"portrait","source":"2GIS"},
  {"src":"/media/2gis/2gis-40.jpg","alt":"Роспись «Quest Room FANTOM» с демоном в лобби, слева в кадр попала рука человека.","orientation":"portrait","source":"2GIS"},
  {"src":"/media/2gis/2gis-27.jpg","alt":"Крупный план наружного баннера «Quest Room FANTOM» с демоном на кирпичной стене.","orientation":"portrait","source":"2GIS"},
  {"src":"/media/2gis/2gis-14.jpg","alt":"Баннер на жёлто-кирпичной стене «Quest Room FANTOM» с призывом «Испытай свой страх» и изображением замка.","orientation":"portrait","source":"2GIS"},
];

/** 17 видео от владельца — обложки лежат локально. */
export const VIDEOS: VideoClip[] = [
  {
    poster: "/media/2gis-video-covers/video-01.jpg",
    hls: "https://filekeeper-vod.2gis.com/26111965-aeba-4b14-bf72-9493fc57c9fb-2s-2gis-ugc-vod-transcoded/sdr-2-sdr/99c28c420264cd561169c6b0258f0e84399485b6/master.m3u8",
    duration: 29,
    orientation: "portrait",
    title: "Обход комнат",
  },
  {
    poster: "/media/2gis-video-covers/video-02.jpg",
    hls: "https://filekeeper-vod.2gis.com/26111965-aeba-4b14-bf72-9493fc57c9fb-2s-2gis-ugc-vod-transcoded/hdr-2-sdr/5efe4a0bc842c232b67034a00f87606c1ade87c3/master.m3u8",
    duration: 57,
    orientation: "portrait",
    title: "Полная экскурсия",
  },
  {
    poster: "/media/2gis-video-covers/video-03.jpg",
    hls: "https://filekeeper-vod.2gis.com/26111965-aeba-4b14-bf72-9493fc57c9fb-2s-2gis-ugc-vod-transcoded/sdr-2-sdr/218d24d9d1b99ed371b3b93468308b3e2db2c61a/master.m3u8",
    duration: 6,
    orientation: "portrait",
    title: "Короткий фрагмент",
  },
  {
    poster: "/media/2gis-video-covers/video-04.jpg",
    hls: "https://filekeeper-vod.2gis.com/26111965-aeba-4b14-bf72-9493fc57c9fb-2s-2gis-ugc-vod-transcoded/sdr-2-sdr/9ed5bd6ab0ac1dbe0c627d7450ebfb2bce412ef8/master.m3u8",
    duration: 8,
    orientation: "landscape",
    title: "За стеной",
  },
  {
    poster: "/media/2gis-video-covers/video-05.jpg",
    hls: "https://filekeeper-vod.2gis.com/26111965-aeba-4b14-bf72-9493fc57c9fb-2s-2gis-ugc-vod-transcoded/sdr-2-sdr/92c7f163fd46ebb4945dcd51dd621181d733a852/master.m3u8",
    duration: 7,
    orientation: "landscape",
    title: "В коридоре",
  },
  {
    poster: "/media/2gis-video-covers/video-06.jpg",
    hls: "https://filekeeper-vod.2gis.com/26111965-aeba-4b14-bf72-9493fc57c9fb-2s-2gis-ugc-vod-transcoded/sdr-2-sdr/ed63dbf3aa1c1e2cc1819f1a6dd868a0a8b1c181/master.m3u8",
    duration: 7,
    orientation: "landscape",
    title: "Мимо камеры",
  },
  {
    poster: "/media/2gis-video-covers/video-07.jpg",
    hls: "https://filekeeper-vod.2gis.com/26111965-aeba-4b14-bf72-9493fc57c9fb-2s-2gis-ugc-vod-transcoded/sdr-2-sdr/0ad1bc43cf2dd28babacab2344702f25473f3395/master.m3u8",
    duration: 11,
    orientation: "portrait",
    title: "Ближе к финалу",
  },
  {
    poster: "/media/2gis-video-covers/video-08.jpg",
    hls: "https://filekeeper-vod.2gis.com/26111965-aeba-4b14-bf72-9493fc57c9fb-2s-2gis-ugc-vod-transcoded/sdr-2-sdr/f8684337738714187e3600f0594a6ba215dfc45a/master.m3u8",
    duration: 14,
    orientation: "portrait",
    title: "Изнутри",
  },
  {
    poster: "/media/2gis-video-covers/video-09.jpg",
    hls: "https://filekeeper-vod.2gis.com/26111965-aeba-4b14-bf72-9493fc57c9fb-2s-2gis-ugc-vod-transcoded/sdr-2-sdr/0b6f357cdb19f87cfd1135c8b80e09c91b8157cd/master.m3u8",
    duration: 4,
    orientation: "landscape",
    title: "Один кадр",
  },
  {
    poster: "/media/2gis-video-covers/video-10.jpg",
    hls: "https://filekeeper-vod.2gis.com/26111965-aeba-4b14-bf72-9493fc57c9fb-2s-2gis-ugc-vod-transcoded/sdr-2-sdr/562f96bab355bead9e58c0ea59cd2b85cfd46fd6/master.m3u8",
    duration: 5,
    orientation: "portrait",
    title: "Тень на стене",
  },
  {
    poster: "/media/2gis-video-covers/video-11.jpg",
    hls: "https://filekeeper-vod.2gis.com/26111965-aeba-4b14-bf72-9493fc57c9fb-2s-2gis-ugc-vod-transcoded/sdr-2-sdr/a37c73f1560445d1307435e48a171b22e3130a75/master.m3u8",
    duration: 12,
    orientation: "portrait",
    title: "Свет гаснет",
  },
  {
    poster: "/media/2gis-video-covers/video-12.jpg",
    hls: "https://filekeeper-vod.2gis.com/26111965-aeba-4b14-bf72-9493fc57c9fb-2s-2gis-ugc-vod-transcoded/sdr-2-sdr/747b741f14e19961622c67f6419ce1fb2e39b231/master.m3u8",
    duration: 8,
    orientation: "landscape",
    title: "Что-то прошло рядом",
  },
  {
    poster: "/media/2gis-video-covers/video-13.jpg",
    hls: "https://filekeeper-vod.2gis.com/26111965-aeba-4b14-bf72-9493fc57c9fb-2s-2gis-ugc-vod-transcoded/sdr-2-sdr/d55d5b84c00083a38574efa6daa8a6b8b777e9f1/master.m3u8",
    duration: 32,
    orientation: "portrait",
    title: "Путь через комнату",
  },
  {
    poster: "/media/2gis-video-covers/video-14.jpg",
    hls: "https://filekeeper-vod.2gis.com/26111965-aeba-4b14-bf72-9493fc57c9fb-2s-2gis-ugc-vod-transcoded/hdr-2-sdr/5edf246bf2694cfd1a325ae2a4dbd1331baecbbd/master.m3u8",
    duration: 51,
    orientation: "landscape",
    title: "Почти три минуты страха",
  },
  {
    poster: "/media/2gis-video-covers/video-15.jpg",
    hls: "https://filekeeper-vod.2gis.com/26111965-aeba-4b14-bf72-9493fc57c9fb-2s-2gis-ugc-vod-transcoded/hdr-2-sdr/509a0de0eea572e353d6d9d740e6a0413f3ac13d/master.m3u8",
    duration: 32,
    orientation: "portrait",
    title: "Второй проход",
  },
  {
    poster: "/media/2gis-video-covers/video-16.jpg",
    hls: "https://filekeeper-vod.2gis.com/26111965-aeba-4b14-bf72-9493fc57c9fb-2s-2gis-ugc-vod-transcoded/sdr-2-sdr/904b0bf24a38876f0884f91890dbd545319d2a68/master.m3u8",
    duration: 22,
    orientation: "portrait",
    title: "Подсмотрено",
  },
  {
    poster: "/media/2gis-video-covers/video-17.jpg",
    hls: "https://filekeeper-vod.2gis.com/26111965-aeba-4b14-bf72-9493fc57c9fb-2s-2gis-ugc-vod-transcoded/sdr-2-sdr/d0f11436128a374f4b8bf45f6194d3c24e11f3ec/master.m3u8",
    duration: 13,
    orientation: "portrait",
    title: "Последний шаг",
  },
];

/** Публикации @fantom_uka_ с реальными подписями автора. */
export const INSTAGRAM_POSTS: (Photo & { caption: string })[] = [
  {
    src: "/media/instagram/ig-01.jpg",
    alt: "Крупный фрагмент росписи FANTOM с демоном в красном свете.",
    orientation: "portrait",
    source: "Instagram",
    caption: "В нашем квесте 3 персонажей теперь испытай эмоции 😎 Самара, Монахиня и клоун Эдди ✌️ #устькаменогорск #ука #оскемен❤️ #квест #хоррор",
  },
  {
    src: "/media/instagram/ig-02.jpg",
    alt: "Полностью чёрный кадр без видимого изображения.",
    orientation: "portrait",
    source: "Instagram",
    caption: "У нас есть то место где вы можете отпраздновать свой день рождения или просто собраться с друзьями поиграть Sony PlayStation или по смотреть фильм,по петь караоке. Мы предоставим вам не забываемые эмоции вместе с KinoLand 🥳 #ука #устькаменогорск #квест #оскемен❤️ #кудасходить",
  },
  {
    src: "/media/instagram/ig-03.jpg",
    alt: "Актёр в образе «монахини» (Valak) в полный рост в синем свете.",
    orientation: "portrait",
    source: "Instagram",
    caption: "Чисто тренд и немного юмора 🤣😎",
  },
  {
    src: "/media/instagram/ig-04.jpg",
    alt: "Ночной размытый кадр: люди в костюмах (в том числе Фредди Крюгер и Майкл Майерс) у купола-перголы.",
    orientation: "portrait",
    source: "Instagram",
    caption: "Самые популярные персонажи квестов 😎😉 #ука #устькаменогорск #квест #хоррор #тренд",
  },
  {
    src: "/media/instagram/ig-05.jpg",
    alt: "Актёр в маске клоуна на пустой парковке с грузовиками днём; вверху водяной знак CapCut AI.",
    orientation: "portrait",
    source: "Instagram",
    caption: "Не отстаём от трендов 😅",
  },
  {
    src: "/media/instagram/ig-06.jpg",
    alt: "Снимок экрана телефона с интерфейсом онлайн-бронирования Quest House FANTOM на фоне красного неона.",
    orientation: "portrait",
    source: "Instagram",
    caption: "Уже совсем скоро у нас будет свой сайт где вы можете ознакомиться с квестом и забронировать квест на нажатия нескольких кнопок на экране😎 #ука #устькаменогорск #квест #оскемен❤️ #развлечение",
  },
  {
    src: "/media/instagram/ig-07.jpg",
    alt: "Текстовая заставка «Мы находимся» на серо-дымном фоне с чёрными полосами сверху и снизу.",
    orientation: "portrait",
    source: "Instagram",
    caption: "Всё в одном видео 😎 #ука #устькаменогорск #квест #оскемен❤️ #кудасходить",
  },
  {
    src: "/media/instagram/ig-08.jpg",
    alt: "Очень тёмный кадр с приоткрытой красной дверью и смутным силуэтом в проёме.",
    orientation: "portrait",
    source: "Instagram",
    caption: "В нашем квесте 3 персонажей 😎 #ука #устькаменогорск #квест #оскемен❤️ #развлечение",
  },
  {
    src: "/media/instagram/ig-09.jpg",
    alt: "Крупное лицо мужчины-актёра с напряжённым выражением в синем свете.",
    orientation: "portrait",
    source: "Instagram",
    caption: "Немного юмора 😅✌️ #ука #устькаменогорск #квест #оскемен❤️ #кудасходить",
  },
  {
    src: "/media/instagram/ig-10.jpg",
    alt: "Очень тёмный кадр, в котором едва различима неоновая надпись «FANTOM».",
    orientation: "portrait",
    source: "Instagram",
    caption: "Мы ждем именно тебя в нашем квесте 😎 #ука #устькаменогорск #квест #развлечение #хоррор",
  },
  {
    src: "/media/instagram/ig-11.jpg",
    alt: "Тёмный кадр с наложением камеры видеонаблюдения («00:34 AM», «CAMERA 01»): красная комната с рамами на стене.",
    orientation: "portrait",
    source: "Instagram",
    caption: "Клоун Эдди 🤡 Страшный клоун которого поглатило зло. Приходите в наш квест и он подарит вам не забываемые эмоции 😎✌️ #ука #устькаменогорск #квест #оскемен❤️ #развлечение",
  },
  {
    src: "/media/instagram/ig-12.jpg",
    alt: "Роспись FANTOM с демоном в тёмно-красном свете, кадр с чёрными полосами сверху и снизу.",
    orientation: "portrait",
    source: "Instagram",
    caption: "Наш квест это страх и эмоции 😎 #ука #устькаменогорск #квест #оскемен❤️ #кудасходить",
  },
];

/** Аватар профиля — логотип Quest House FANTOM. */
export const INSTAGRAM_AVATAR = "/media/instagram/ig-avatar.jpg";

/** Соцдоказательство: 2ГИС показывает 62 медиа на карточке. */
export const MEDIA_COUNTS = {
  photos: 45,
  videos: 17,
  instagramPosts: 12,
} as const;
