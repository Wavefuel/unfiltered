export interface NewsItem {
  id: string
  title: string
  category: string
  date: string
  image: string
  excerpt: string
  content: string[]
  location: {
    lat: number
    lng: number
  }
  icon?: string
}
