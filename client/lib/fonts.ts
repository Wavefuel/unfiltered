import { Playfair_Display, Playfair_Display_SC } from "next/font/google"

// Using Playfair Display as a replacement for IM Fell English
// since IM Fell English might not be available in Google Fonts
export const IMFellEnglish = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-im-fell-english",
})

export const IMFellEnglishSC = Playfair_Display_SC({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-im-fell-english-sc",
})
