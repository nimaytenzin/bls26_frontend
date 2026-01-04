import { SurveyStatus } from "../../constants/enums";
import { AdministrativeZoneType } from "../location/administrative-zone/administrative-zone.dto";

export interface EnumerationAreaHierarchyDto {
  id: number;
  name: string;
  areaCode: string;
  surveyEnumerationAreaId: number;
  totalHouseholdCount: number;
  // Enumeration status
  isEnumerated: boolean;
  enumeratedBy: number | null;
  enumerationDate: Date | null;
  // Sampling status
  isSampled: boolean;
  sampledBy: number | null;
  sampledDate: Date | null;
  // Publishing status
  isPublished: boolean;
  publishedBy: number | null;
  publishedDate: Date | null;
}

export interface SubAdministrativeZoneHierarchyDto {
  id: number;
  name: string;
  areaCode: string;
  type: string;
  enumerationAreas: EnumerationAreaHierarchyDto[];
}

export interface AdministrativeZoneHierarchyDto {
  id: number;
  name: string;
  areaCode: string;
  type: AdministrativeZoneType;
  subAdministrativeZones: SubAdministrativeZoneHierarchyDto[];
}

export interface DzongkhagHierarchyDto {
  id: number;
  name: string;
  areaCode: string;
  administrativeZones: AdministrativeZoneHierarchyDto[];
}

export interface SurveyEnumerationHierarchySummaryDto {
  totalDzongkhags: number;
  totalAdministrativeZones: number;
  totalSubAdministrativeZones: number;
  totalEnumerationAreas: number;
}

export interface SurveyEnumerationHierarchyDto {
  survey: {
    id: number;
    name: string;
    year: number;
    status: SurveyStatus;
  };
  summary: SurveyEnumerationHierarchySummaryDto;
  hierarchy: DzongkhagHierarchyDto[];
}
