export type HeroSlide = {
  id: number
  titleKey: string
  textKey: string
  image: string
}

export type HotelPreview = {
  id: string
  category: HotelCategory
  images: string[]
  promoCode: string
  bookingUrl: string
  bookingParams: {
    firstName: string
    lastName: string
    email: string
    promoCode: string
  }
  nameKey: string
  locationKey: string
  descriptionKey: string
  featuresKey: string
  featuresLabelKey?: string
  statsKey?: string
  bookingSuedtirol?: {
    id: string
    propertyId: number
    promotion: [string, string, string]
  }
}

export type HotelCategory = 'fiveStar' | 'fourStar' | 'chalet'

export type HowItWorksStep = {
  id: number
  title: string
  text: string
}

export type WhyMeReason = {
  id: number
  title: string
  text: string
}

export type InstructorFeature = {
  id: number
  text: string
}

export type Review = {
  id: number
  text: string
  author: string
  location: string
  date: string
  source: 'instagram' | 'google'
}

export const heroSlides: HeroSlide[] = [
  {
    id: 1,
    titleKey: 'home.slide1.title',
    textKey: 'home.slide1.text',
    image: '/main-slider/slide1.jpg',
  },
  {
    id: 2,
    titleKey: 'home.slide2.title',
    textKey: 'home.slide2.text',
    image: '/main-slider/slide2.jpg',
  },
  {
    id: 3,
    titleKey: 'home.slide3.title',
    textKey: 'home.slide3.text',
    image: '/main-slider/slide3.jpg',
  },
  {
    id: 4,
    titleKey: 'home.slide4.title',
    textKey: 'home.slide4.text',
    image: '/main-slider/slide4.jpg',
  },
  {
    id: 5,
    titleKey: 'home.slide5.title',
    textKey: 'home.slide5.text',
    image: '/main-slider/slide5.jpg',
  },
  {
    id: 6,
    titleKey: 'home.slide6.title',
    textKey: 'home.slide6.text',
    image: '/main-slider/slide6.jpg',
  },
]

export const hotelPreviews: HotelPreview[] = [
  {
    id: 'oswald',
    category: 'fourStar',
    images: ['/mockup-assets/image7.png', '/mockup-assets/image8.png'],
    promoCode: 'REPLACE_OSWALD',
    bookingUrl: 'https://example.com/oswald/booking',
    bookingParams: {
      firstName: 'firstName',
      lastName: 'lastName',
      email: 'email',
      promoCode: 'promoCode',
    },
    nameKey: 'home.hotels.oswald.name',
    locationKey: 'home.hotels.oswald.location',
    descriptionKey: 'home.hotels.oswald.description',
    featuresKey: 'home.hotels.oswald.features',
  },
  {
    id: 'edenselva',
    category: 'fourStar',
    images: ['/edenselva/edenselva1.jpg', '/edenselva/edenselva2.jpg', '/edenselva/edenselva3.jpg', '/edenselva/edenselva4.jpg'],
    promoCode: 'REPLACE_EDENSELVA',
    bookingUrl: 'https://example.com/edenselva/booking',
    bookingParams: {
      firstName: 'first_name',
      lastName: 'last_name',
      email: 'guest_email',
      promoCode: 'promo_code',
    },
    nameKey: 'home.hotels.edenselva.name',
    locationKey: 'home.hotels.edenselva.location',
    descriptionKey: 'home.hotels.edenselva.description',
    featuresKey: 'home.hotels.edenselva.features',
  },
  {
    id: 'alpenroyal',
    category: 'fiveStar',
    images: [
      '/alpenroyal/alpenroyal-summer-exterior-pool.jpg',
      '/alpenroyal/alpenroyal-winter-exterior-aerial.jpg',
      '/alpenroyal/alpenroyal-suite-bedroom.jpg',
      '/alpenroyal/alpenroyal-restaurant-dining-room.jpg',
      '/alpenroyal/alpenroyal-spa-relaxation-room.jpg',
      '/alpenroyal/alpenroyal-spa-lounge.jpg',
    ],
    promoCode: 'REPLACE_ALPENROYAL',
    bookingUrl: 'https://example.com/alpenroyal/booking',
    bookingParams: {
      firstName: 'name',
      lastName: 'surname',
      email: 'email',
      promoCode: 'coupon',
    },
    nameKey: 'home.hotels.alpenroyal.name',
    locationKey: 'home.hotels.alpenroyal.location',
    descriptionKey: 'home.hotels.alpenroyal.description',
    featuresKey: 'home.hotels.alpenroyal.features',
  },
  {
    id: 'posta',
    category: 'fourStar',
    images: [
      '/posta_4/Posta4 (1).jpg',
      '/posta_4/posta1.jpg',
      '/posta_4/FamilyHotel(3) (3).jpg',
    ],
    promoCode: 'REPLACE_POSTA',
    bookingUrl: 'https://example.com/posta/booking',
    bookingParams: {
      firstName: 'guestName',
      lastName: 'guestSurname',
      email: 'guestEmail',
      promoCode: 'promotionCode',
    },
    nameKey: 'home.hotels.posta.name',
    locationKey: 'home.hotels.posta.location',
    descriptionKey: 'home.hotels.posta.description',
    featuresKey: 'home.hotels.posta.features',
    bookingSuedtirol: {
      id: 'cb10173a-7255-4e60-99c5-6cfb42c2f5b4',
      propertyId: 10957,
      promotion: ['affiliate', 'fursadolomiti.com', 'posta_10957'],
    },
  },
  {
    id: 'continental',
    category: 'fourStar',
    images: [
      'hotel-continental/continental1.jpg',
      'hotel-continental/continental2.jpg',
      'hotel-continental/continental3.jpg',
      'hotel-continental/continental4.png',
    ],
    promoCode: 'REPLACE_CONTINENTAL',
    bookingUrl: 'https://example.com/continental/booking',
    bookingParams: {
      firstName: 'firstName',
      lastName: 'lastName',
      email: 'emailAddress',
      promoCode: 'promo',
    },
    nameKey: 'home.hotels.continental.name',
    locationKey: 'home.hotels.continental.location',
    descriptionKey: 'home.hotels.continental.description',
    featuresKey: 'home.hotels.continental.features',
  },
  {
    id: 'luna-mondschein',
    category: 'fourStar',
    images: ['hotel-luna/luna1.jpg', 'hotel-luna/luna2.jpg', 'hotel-luna/luna3.jpg', 'hotel-luna/luna4.jpg'],
    promoCode: 'REPLACE_LUNA_MONDSCHEIN',
    bookingUrl: 'https://example.com/luna-mondschein/booking',
    bookingParams: {
      firstName: 'firstname',
      lastName: 'lastname',
      email: 'email',
      promoCode: 'voucher',
    },
    nameKey: 'home.hotels.lunaMondschein.name',
    locationKey: 'home.hotels.lunaMondschein.location',
    descriptionKey: 'home.hotels.lunaMondschein.description',
    featuresKey: 'home.hotels.lunaMondschein.features',
  },
  {
    id: 'dolomites-chalet',
    category: 'chalet',
    images: ['/mockup-assets/image8.png', '/mockup-assets/image7.png'],
    promoCode: 'REPLACE_DOLOMITES_CHALET',
    bookingUrl: 'https://example.com/dolomites-chalet/booking',
    bookingParams: {
      firstName: 'contact_first_name',
      lastName: 'contact_last_name',
      email: 'contact_email',
      promoCode: 'referral_code',
    },
    nameKey: 'home.hotels.dolomitesChalet.name',
    locationKey: 'home.hotels.dolomitesChalet.location',
    descriptionKey: 'home.hotels.dolomitesChalet.description',
    featuresKey: 'home.hotels.dolomitesChalet.features',
    featuresLabelKey: 'home.hotels.dolomitesChalet.featuresLabel',
    statsKey: 'home.hotels.dolomitesChalet.stats',
  },
  {
    id: 'luxury-chalet-p',
    category: 'chalet',
    images: ['/mockup-assets/image8.png', '/mockup-assets/image7.png'],
    promoCode: 'REPLACE_LUXURY_CHALET_P',
    bookingUrl: 'https://example.com/luxury-chalet-p/booking',
    bookingParams: {
      firstName: 'contact_first_name',
      lastName: 'contact_last_name',
      email: 'contact_email',
      promoCode: 'referral_code',
    },
    nameKey: 'home.hotels.luxuryChaletP.name',
    locationKey: 'home.hotels.luxuryChaletP.location',
    descriptionKey: 'home.hotels.luxuryChaletP.description',
    featuresKey: 'home.hotels.luxuryChaletP.features',
    featuresLabelKey: 'home.hotels.luxuryChaletP.featuresLabel',
  },
  {
    id: 'villa-carolina',
    category: 'chalet',
    images: ['villa-carolina/villa-carolina1.jpg', 'villa-carolina/villa-carolina2.jpg', 'villa-carolina/villa-carolina3.jpg', 'villa-carolina/villa-carolina4.jpg'],
    promoCode: 'REPLACE_VILLA_CAROLINA',
    bookingUrl: 'https://example.com/villa-carolina/booking',
    bookingParams: {
      firstName: 'contact_first_name',
      lastName: 'contact_last_name',
      email: 'contact_email',
      promoCode: 'referral_code',
    },
    nameKey: 'home.hotels.villaCarolina.name',
    locationKey: 'home.hotels.villaCarolina.location',
    descriptionKey: 'home.hotels.villaCarolina.description',
    featuresKey: 'home.hotels.villaCarolina.features',
    featuresLabelKey: 'home.hotels.villaCarolina.featuresLabel',
  },
]
