declare module 'natural/lib/natural/stemmers/porter_stemmer' {
  export const PorterStemmer: {
    stem: (token: string) => string;
    tokenizeAndStem: (text: string, keepStops?: boolean) => string[];
    attach: () => void;
  };
}

declare module 'stopword' {
  export function removeStopwords(tokens: string[]): string[];
  export const en: string[];
  export const de: string[];
  export const fr: string[];
  // Add more languages as needed
} 