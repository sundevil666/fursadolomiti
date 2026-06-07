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
  nameKey: string
  locationKey: string
  descriptionKey: string
  featuresKey: string
  featuresLabelKey?: string
  statsKey?: string
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
    nameKey: 'home.hotels.oswald.name',
    locationKey: 'home.hotels.oswald.location',
    descriptionKey: 'home.hotels.oswald.description',
    featuresKey: 'home.hotels.oswald.features',
  },
  {
    id: 'edenselva',
    category: 'fourStar',
    images: ['/mockup-assets/image8.png', '/mockup-assets/image7.png'],
    promoCode: 'REPLACE_EDENSELVA',
    nameKey: 'home.hotels.edenselva.name',
    locationKey: 'home.hotels.edenselva.location',
    descriptionKey: 'home.hotels.edenselva.description',
    featuresKey: 'home.hotels.edenselva.features',
  },
  {
    id: 'alpenroyal',
    category: 'fiveStar',
    images: ['/mockup-assets/image7.png', '/mockup-assets/image8.png'],
    promoCode: 'REPLACE_ALPENROYAL',
    nameKey: 'home.hotels.alpenroyal.name',
    locationKey: 'home.hotels.alpenroyal.location',
    descriptionKey: 'home.hotels.alpenroyal.description',
    featuresKey: 'home.hotels.alpenroyal.features',
  },
  {
    id: 'posta',
    category: 'fourStar',
    images: ['/mockup-assets/image8.png', '/mockup-assets/image7.png'],
    promoCode: 'REPLACE_POSTA',
    nameKey: 'home.hotels.posta.name',
    locationKey: 'home.hotels.posta.location',
    descriptionKey: 'home.hotels.posta.description',
    featuresKey: 'home.hotels.posta.features',
  },
  {
    id: 'continental',
    category: 'fourStar',
    images: ['/mockup-assets/image7.png', '/mockup-assets/image8.png'],
    promoCode: 'REPLACE_CONTINENTAL',
    nameKey: 'home.hotels.continental.name',
    locationKey: 'home.hotels.continental.location',
    descriptionKey: 'home.hotels.continental.description',
    featuresKey: 'home.hotels.continental.features',
  },
  {
    id: 'luna-mondschein',
    category: 'fourStar',
    images: ['/mockup-assets/image8.png', '/mockup-assets/image7.png'],
    promoCode: 'REPLACE_LUNA_MONDSCHEIN',
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
    nameKey: 'home.hotels.dolomitesChalet.name',
    locationKey: 'home.hotels.dolomitesChalet.location',
    descriptionKey: 'home.hotels.dolomitesChalet.description',
    featuresKey: 'home.hotels.dolomitesChalet.features',
    featuresLabelKey: 'home.hotels.dolomitesChalet.featuresLabel',
    statsKey: 'home.hotels.dolomitesChalet.stats',
  },
]
