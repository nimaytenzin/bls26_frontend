/**
 * Public Page Settings Interface
 * This interface represents the settings for the public data viewer page
 */
export interface PublicPageSettings {
  mapVisualizationMode: 'households' | 'enumerationAreas';
  selectedBasemapId: string;
  colorScale: string;
  nationalDataViewerTitle: string;
  nationalDataViewerDescription: string;
  nationalDataViewerInfoBoxContent: string;
  nationalDataViewerInfoBoxStats: string;
}

/**
 * Public Page Settings DTO from API
 * Includes audit fields from the database
 */
export interface PublicPageSettingsDto extends PublicPageSettings {
  id: number;
  createdBy?: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update DTO for partial updates
 */
export interface UpdatePublicPageSettingsDto {
  mapVisualizationMode?: 'households' | 'enumerationAreas';
  selectedBasemapId?: string;
  colorScale?: string;
  nationalDataViewerTitle?: string;
  nationalDataViewerDescription?: string;
  nationalDataViewerInfoBoxContent?: string;
  nationalDataViewerInfoBoxStats?: string;
}

