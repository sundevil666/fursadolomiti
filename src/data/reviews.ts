import type { AppLocale } from '@/i18n'

export type ReviewSource = 'instagram' | 'google'

export type GuestReview = {
  id: number
  text: string
  translations: Partial<Record<AppLocale, string>>
  author: string
  location: Record<AppLocale, string>
  date: Record<AppLocale, string>
  source: ReviewSource
}

export const guestReviews: GuestReview[] = [
  {
    id: 1,
    text: 'Any recommendations you have suggested to us was 1000000 🔥🔥🔥🔥',
    translations: {
      ru: 'Все рекомендации, которые вы нам дали, были на миллион 🔥🔥🔥🔥',
      en: 'Any recommendations you have suggested to us was 1000000 🔥🔥🔥🔥',
      it: 'Tutti i consigli che ci hai dato sono stati da un milione 🔥🔥🔥🔥',
    },
    source: 'instagram',
    author: 'Mor',
    location: {
      ru: 'Израиль',
      en: 'Israel',
      it: 'Israele',
    },
    date: {
      ru: 'Июль 2026',
      en: 'July 2026',
      it: 'Luglio 2026',
    },
  },
  {
    id: 2,
    text: 'One week of pure bliss in the Dolomites. I came across @fursadolomiti on Insta and she gave me discount codes for accommodation and ski rental. I would highly recommend saving her profile if you plan to visit the Val Gardena region. 🤍',
    translations: {
      ru: 'Неделя настоящего блаженства в Доломитах. Я случайно нашла @fursadolomiti в Instagram, и она дала мне скидочные коды на проживание и аренду лыж. Очень рекомендую сохранить ее профиль, если вы планируете поездку в регион Валь-Гардена. 🤍',
      en: 'One week of pure bliss in the Dolomites. I came across @fursadolomiti on Insta and she gave me discount codes for accommodation and ski rental. I would highly recommend saving her profile if you plan to visit the Val Gardena region. 🤍',
      it: "Una settimana di puro benessere nelle Dolomiti. Ho scoperto @fursadolomiti su Instagram e mi ha dato codici sconto per l'alloggio e il noleggio sci. Consiglio davvero di salvare il suo profilo se avete in programma di visitare la Val Gardena. 🤍",
    },
    source: 'instagram',
    author: 'Allen',
    location: {
      ru: 'Ирландия',
      en: 'Ireland',
      it: 'Irlanda',
    },
    date: {
      ru: 'Март 2026',
      en: 'March 2026',
      it: 'Marzo 2026',
    },
  },
  {
    id: 3,
    text: 'Хочу от всей души поблагодарить Татьяну за помощь в Валь Гардене ❤️\n\nЭто была не просто формальная организация уроков, а реально человеческое участие. Она не только позвонила в лыжную школу и уточнила, есть ли свободные русскоговорящие инструкторы на мои даты, но и посоветовала конкретных людей, которых знает лично, а не просто тех, кого предложила школа. Договорилась с инструкторами о месте встречи, подробно объяснила, как туда дойти — для меня это было очень важно.\n\nПосле уроков она ещё и перезванивала, спрашивала, как всё прошло, всё ли понравилось — такое внимание сейчас редкость.\n\nОтдельное спасибо за рекомендации трасс для самостоятельного катания — советы были очень в точку и реально помогли чувствовать себя увереннее.\n\nПлюс она даже приехала со мной в спортивный магазин проката, где у неё работают знакомые, и помогла с выбором инвентаря. Это вообще уровень заботы «как для своих».\n\nОчень тёплая, внимательная и надёжная женщина. Если вам нужна помощь в Валь Гардене — смело рекомендую. С ней чувствуешь, что о тебе реально думают, а не просто «отработали заявку».',
    translations: {
      ru: 'Хочу от всей души поблагодарить Татьяну за помощь в Валь Гардене ❤️\n\nЭто была не просто формальная организация уроков, а реально человеческое участие. Она не только позвонила в лыжную школу и уточнила, есть ли свободные русскоговорящие инструкторы на мои даты, но и посоветовала конкретных людей, которых знает лично, а не просто тех, кого предложила школа. Договорилась с инструкторами о месте встречи, подробно объяснила, как туда дойти — для меня это было очень важно.\n\nПосле уроков она ещё и перезванивала, спрашивала, как всё прошло, всё ли понравилось — такое внимание сейчас редкость.\n\nОтдельное спасибо за рекомендации трасс для самостоятельного катания — советы были очень в точку и реально помогли чувствовать себя увереннее.\n\nПлюс она даже приехала со мной в спортивный магазин проката, где у неё работают знакомые, и помогла с выбором инвентаря. Это вообще уровень заботы «как для своих».\n\nОчень тёплая, внимательная и надёжная женщина. Если вам нужна помощь в Валь Гардене — смело рекомендую. С ней чувствуешь, что о тебе реально думают, а не просто «отработали заявку».',
      en: 'I would like to sincerely thank Tatiana for her help in Val Gardena ❤️\n\nThis was not just a formal arrangement of lessons, but real human involvement. She not only called the ski school and checked whether Russian-speaking instructors were available for my dates, but also recommended specific people she knows personally, not simply whoever the school suggested. She arranged the meeting point with the instructors and explained in detail how to get there, which was very important for me.\n\nAfter the lessons, she even called back to ask how everything went and whether I liked it. This kind of attention is rare now.\n\nA special thank you for the piste recommendations for skiing on my own. The advice was very precise and genuinely helped me feel more confident.\n\nShe even came with me to the sports rental shop, where people she knows work, and helped me choose the equipment. That is truly a level of care that feels like being looked after as one of her own.\n\nTatiana is a very warm, attentive and reliable woman. If you need help in Val Gardena, I can confidently recommend her. With her, you feel that someone is really thinking about you, not just “processing a request”.',
      it: 'Vorrei ringraziare di cuore Tatiana per il suo aiuto in Val Gardena ❤️\n\nNon è stata una semplice organizzazione formale delle lezioni, ma un vero coinvolgimento umano. Non solo ha chiamato la scuola sci per verificare se ci fossero maestri russofoni disponibili per le mie date, ma mi ha anche consigliato persone specifiche che conosce personalmente, non semplicemente quelle proposte dalla scuola. Ha concordato con i maestri il punto d’incontro e mi ha spiegato in dettaglio come arrivarci, cosa per me era molto importante.\n\nDopo le lezioni mi ha persino richiamata per chiedere com’era andata e se mi era piaciuto tutto. Un’attenzione così oggi è rara.\n\nUn ringraziamento speciale anche per i consigli sulle piste dove sciare in autonomia: erano davvero azzeccati e mi hanno aiutata concretamente a sentirmi più sicura.\n\nIn più è venuta con me in un negozio di noleggio sportivo, dove lavorano persone che conosce, e mi ha aiutata a scegliere l’attrezzatura. Questo è proprio un livello di cura “come per una persona di famiglia”.\n\nTatiana è una donna molto calorosa, attenta e affidabile. Se avete bisogno di aiuto in Val Gardena, la consiglio senza esitazione. Con lei senti che qualcuno pensa davvero a te, non che si limiti a “gestire una richiesta”.',
    },
    source: 'google',
    author: 'Екатерина',
    location: {
      ru: 'Эстония',
      en: 'Estonia',
      it: 'Estonia',
    },
    date: {
      ru: 'Январь 2026',
      en: 'January 2026',
      it: 'Gennaio 2026',
    },
  },
  {
    id: 4,
    text: 'Неймовірний відпочинок допомогла нам підготувати Тетяна. Боже, усе погодила, ми вибрали класний готель з усіма функціями, який нам супер підійшов. Вид з номера найкращий, прямо біля підйомника, коли приїхали, вона нас зустріла і одразу допомогла оформити прокат лиж, які нам привезли одразу в готель. Потім швидко провела екскурсію по місту і показала найкращі ресторани і розказала, де поряд ще можна з’їздити погуляти.\n\nЗабронювала в короткі строки нам інструктора для дитини. Вона за 4 дні вже впевнено каталась, хоча стала на лижі вперше. Потім ми змогли сходити на екскурсію в готель, який нам сподобався на наступну поїздку, подивились номери і поговорили по цінам. Було значно дешевше, чим на Букінгу.\n\nДякую за такий сервіс. Ми обов’язково ще повернемось. А так і ще, наш готель був в 30 метрах від підйомника. Просто казка.',
    translations: {
      ru: 'Невероятный отдых помогла нам подготовить Татьяна. Боже, она все согласовала, мы выбрали классный отель со всеми функциями, который нам супер подошел. Вид из номера был лучший, прямо возле подъемника. Когда мы приехали, она нас встретила и сразу помогла оформить прокат лыж, которые нам привезли прямо в отель. Потом быстро провела экскурсию по городу, показала лучшие рестораны и рассказала, куда рядом еще можно съездить погулять.\n\nВ короткие сроки забронировала нам инструктора для ребенка. За 4 дня она уже уверенно каталась, хотя впервые встала на лыжи. Потом мы смогли сходить на экскурсию в отель, который нам понравился для следующей поездки, посмотрели номера и поговорили о ценах. Было значительно дешевле, чем на Booking.\n\nСпасибо за такой сервис. Мы обязательно еще вернемся. И да, наш отель был в 30 метрах от подъемника. Просто сказка.',
      en: 'Tatiana helped us prepare an incredible holiday. She arranged absolutely everything, and we chose a wonderful hotel with all the facilities we needed, which suited us perfectly. The view from the room was the best, right next to the lift. When we arrived, she met us and immediately helped arrange ski rental, which was delivered straight to the hotel. Then she gave us a quick tour of the town, showed us the best restaurants and told us where else nearby we could go for a walk or a day out.\n\nOn short notice, she booked an instructor for our child. In 4 days, our daughter was already skiing confidently, even though it was her first time on skis. Later, we were able to tour a hotel we liked for our next trip, see the rooms and discuss prices. It was significantly cheaper than on Booking.\n\nThank you for this level of service. We will definitely come back. And one more thing: our hotel was 30 meters from the lift. A real fairy tale.',
      it: 'Tatiana ci ha aiutati a preparare una vacanza incredibile. Ha organizzato tutto, e abbiamo scelto un bellissimo hotel con tutti i servizi di cui avevamo bisogno, perfetto per noi. La vista dalla camera era fantastica, proprio vicino all’impianto di risalita. Quando siamo arrivati, ci ha accolti e ci ha subito aiutati a organizzare il noleggio degli sci, che ci sono stati consegnati direttamente in hotel. Poi ci ha fatto fare un breve giro della città, ci ha mostrato i migliori ristoranti e ci ha raccontato dove si poteva andare nei dintorni per una passeggiata o una gita.\n\nIn pochissimo tempo ci ha prenotato un maestro di sci per la bambina. In 4 giorni sciava già con sicurezza, anche se era la prima volta sugli sci. Poi siamo riusciti a visitare un hotel che ci era piaciuto per il prossimo viaggio, vedere le camere e parlare dei prezzi. Era molto più conveniente rispetto a Booking.\n\nGrazie per un servizio così. Torneremo sicuramente. E ancora una cosa: il nostro hotel era a 30 metri dall’impianto. Una vera favola.',
    },
    source: 'google',
    author: 'Виктория',
    location: {
      ru: 'Украина',
      en: 'Ukraine',
      it: 'Ucraina',
    },
    date: {
      ru: 'Январь 2026',
      en: 'January 2026',
      it: 'Gennaio 2026',
    },
  },
  {
    id: 5,
    text: 'Спасибо большое Татьяне за наш отдых! Татьяна помогает решать любые вопросы, очень внимательный, отзывчивый человек.',
    translations: {
      ru: 'Спасибо большое Татьяне за наш отдых! Татьяна помогает решать любые вопросы, очень внимательный, отзывчивый человек.',
      en: 'Many thanks to Tatiana for our holiday! Tatiana helps solve any questions and is a very attentive, responsive person.',
      it: 'Grazie mille a Tatiana per la nostra vacanza! Tatiana aiuta a risolvere qualsiasi domanda ed è una persona molto attenta e disponibile.',
    },
    source: 'google',
    author: 'Анна',
    location: {
      ru: 'Россия',
      en: 'Russia',
      it: 'Russia',
    },
    date: {
      ru: 'Январь 2026',
      en: 'January 2026',
      it: 'Gennaio 2026',
    },
  },
  {
    id: 6,
    text: 'Очень приятная женщина, с любыми вопросами — поможет сразу, всё расскажет, всегда на связи. Сотрудничает напрямую с прокатом и школой, цена на сайтах и цена через нее — не отличается, но она всегда поможет в случае возникновения каких-либо проблем. Рекомендую 👍',
    translations: {
      ru: 'Очень приятная женщина, с любыми вопросами — поможет сразу, всё расскажет, всегда на связи. Сотрудничает напрямую с прокатом и школой, цена на сайтах и цена через нее — не отличается, но она всегда поможет в случае возникновения каких-либо проблем. Рекомендую 👍',
      en: 'A very pleasant woman. Whatever questions you have, she helps right away, explains everything and is always in touch. She works directly with the rental shop and ski school. The price on the websites and the price through her are the same, but she will always help if any problems come up. I recommend her 👍',
      it: 'Una donna molto piacevole. Per qualsiasi domanda aiuta subito, spiega tutto ed è sempre disponibile. Collabora direttamente con il noleggio e la scuola sci. Il prezzo sui siti e il prezzo tramite lei non cambia, ma lei aiuta sempre se dovesse sorgere qualche problema. La consiglio 👍',
    },
    source: 'google',
    author: 'Гога',
    location: {
      ru: 'Россия',
      en: 'Russia',
      it: 'Russia',
    },
    date: {
      ru: 'Январь 2026',
      en: 'January 2026',
      it: 'Gennaio 2026',
    },
  },
]
