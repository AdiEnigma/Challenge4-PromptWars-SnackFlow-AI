export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'ja';

export interface Announcement {
  id: string;
  text: string;
  translations: Record<SupportedLanguage, string>;
  targetAudience: string;
  createdBy: string;
  publishedAt: string;
  isActive: boolean;
}

export interface AnnouncementCreate {
  text: string;
  targetAudience: string;
  translateTo?: SupportedLanguage[];
}

export interface TranslatedAnnouncement {
  original: string;
  translations: Record<SupportedLanguage, string>;
}
