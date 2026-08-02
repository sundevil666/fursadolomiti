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
]
