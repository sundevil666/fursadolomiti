export type HeroSlide = {
  id: number
  titleKey: string
  textKey: string
  image: string
}

export type HotelPreview = {
  id: string
  images: string[]
  nameKey: string
  locationKey: string
  descriptionKey: string
  featuresKey: string
}

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
    image: '/mockup-assets/image9.png',
  },
  {
    id: 2,
    titleKey: 'home.slide2.title',
    textKey: 'home.slide2.text',
    image: '/mockup-assets/image11.png',
  },
  {
    id: 3,
    titleKey: 'home.slide3.title',
    textKey: 'home.slide3.text',
    image: '/mockup-assets/image6.png',
  },
]

export const hotelPreviews: HotelPreview[] = [
  {
    id: 'alpenroyal',
    images: ['/mockup-assets/image7.png', '/mockup-assets/image1.png', '/mockup-assets/image2.png'],
    nameKey: 'home.hotels.alpenroyal.name',
    locationKey: 'home.hotels.alpenroyal.location',
    descriptionKey: 'home.hotels.alpenroyal.description',
    featuresKey: 'home.hotels.alpenroyal.features',
  },
  {
    id: 'edenselva',
    images: ['/mockup-assets/image8.png', '/mockup-assets/image3.png', '/mockup-assets/image4.png'],
    nameKey: 'home.hotels.edenselva.name',
    locationKey: 'home.hotels.edenselva.location',
    descriptionKey: 'home.hotels.edenselva.description',
    featuresKey: 'home.hotels.edenselva.features',
  },
]
