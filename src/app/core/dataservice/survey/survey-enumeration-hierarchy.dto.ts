import { SurveyStatus } from "../../constants/enums";
import { AdministrativeZoneType } from "../location/administrative-zone/administrative-zone.dto";

export interface EnumerationAreaHierarchyDto {
  id: number;
  name: string;
  areaCode: string;
  surveyEnumerationAreaId: number;
  totalHouseholdCount: number;
  // Submission status
  isSubmitted: boolean;
  submittedBy: number | null;
  submissionDate: string | null;
  // Validation status
  isValidated: boolean;
  validatedBy: number | null;
  validationDate: string | null;
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
  areaSqKm: number;
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
