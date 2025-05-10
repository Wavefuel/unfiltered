export interface ScrapeRequest {
  url: string;
  baseUrl?: string;
  data: ScrapeData[];
  puppet?: {
    scroll?: {
      timeout?: number;
    };
    scrollClick?: {
      timeout?: number;
      element?: string;
    };
  };
}

export interface ScrapeData {
  query?: string;
  name?: string;
  type?: string;
  typeVal?: string;
  query_name?: string;
  query_val?: string;
  scrapeResult?: ScrapeRequest[];
}

export interface ScrapedResult {
  url: string;
  title: string | null;
  favicon: string | null;
  description: string | null;
  image: string | null;
  author: string | null;
  data: any[] | null;
}

export interface ModRequest {
  requests: ScrapeRequest[];
}

export interface PuppetInstance {
  browser: any;
}

export interface PageResult {
  content: string;
  page: any;
  browser?: any;
} 