import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../../constants/constants';
import {
    BuildingLeasePaymentStatusDTO,
    CreateLeaseAgreementDTO,
    LandLeasePaymentStatusDTO,
    LeaseAgreeementDTO,
    LeaseAgreementAttachmentDTO,
    LeaseModificationDTO,
    PropertyLeaseAvailabilityCheckerReturnDTO,
    PropertyLeaseAvailabiltyCheckerDTO,
    PropertyLeaseOverDueCalculatorDTO,
    PropertyLeaseOverDueReturnDTO,
    UnitLeasePaymentStatusDTO,
} from './lease-agreement.dto';
import {
    PaginatedData,
    PaginatedParamsOptions,
} from '../../dto/paginated-data.dto';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class LeaseAgreementDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    //UNIT LEASE AGREEMENT//
    GetAllUnitLeaseByAdminPaginated(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<LeaseAgreeementDTO>> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.pageNo !== undefined) {
                httpParams = httpParams.append(
                    'pageNo',
                    params.pageNo.toString()
                );
            }
            if (params.pageSize !== undefined) {
                httpParams = httpParams.append(
                    'pageSize',
                    params.pageSize.toString()
                );
            }
        }

        return this.http.get<PaginatedData<LeaseAgreeementDTO>>(
            `${this.apiUrl}/lease-agreement/admin/unit/p/${adminId}`,
            { params: httpParams }
        );
    }

    GetAllActiveUnitLeaseByAdminPaginated(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<LeaseAgreeementDTO>> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.pageNo !== undefined) {
                httpParams = httpParams.append(
                    'pageNo',
                    params.pageNo.toString()
                );
            }
            if (params.pageSize !== undefined) {
                httpParams = httpParams.append(
                    'pageSize',
                    params.pageSize.toString()
                );
            }
        }

        return this.http.get<PaginatedData<LeaseAgreeementDTO>>(
            `${this.apiUrl}/lease-agreement/admin/unit/active/p/${adminId}`,
            { params: httpParams }
        );
    }

    GetAllPendingUnitLeaseByAdminPaginated(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<LeaseAgreeementDTO>> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.pageNo !== undefined) {
                httpParams = httpParams.append(
                    'pageNo',
                    params.pageNo.toString()
                );
            }
            if (params.pageSize !== undefined) {
                httpParams = httpParams.append(
                    'pageSize',
                    params.pageSize.toString()
                );
            }
        }

        return this.http.get<PaginatedData<LeaseAgreeementDTO>>(
            `${this.apiUrl}/lease-agreement/admin/unit/pending/p/${adminId}`,
            { params: httpParams }
        );
    }

    GetAllUpcomingExpirationUnitLeaseByAdminPaginated(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<LeaseAgreeementDTO>> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.pageNo !== undefined) {
                httpParams = httpParams.append(
                    'pageNo',
                    params.pageNo.toString()
                );
            }
            if (params.pageSize !== undefined) {
                httpParams = httpParams.append(
                    'pageSize',
                    params.pageSize.toString()
                );
            }
        }

        return this.http.get<PaginatedData<LeaseAgreeementDTO>>(
            `${this.apiUrl}/lease-agreement/admin/unit/upcoming-expiration/p/${adminId}`,
            { params: httpParams }
        );
    }

    //END EUNIT LEASe

    //LAND LEASE
    GetAllLandLeaseByAdminPaginated(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<LeaseAgreeementDTO>> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.pageNo !== undefined) {
                httpParams = httpParams.append(
                    'pageNo',
                    params.pageNo.toString()
                );
            }
            if (params.pageSize !== undefined) {
                httpParams = httpParams.append(
                    'pageSize',
                    params.pageSize.toString()
                );
            }
        }

        return this.http.get<PaginatedData<LeaseAgreeementDTO>>(
            `${this.apiUrl}/lease-agreement/admin/land/p/${adminId}`,
            { params: httpParams }
        );
    }

    GetAllActiveLandLeaseByAdminPaginated(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<LeaseAgreeementDTO>> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.pageNo !== undefined) {
                httpParams = httpParams.append(
                    'pageNo',
                    params.pageNo.toString()
                );
            }
            if (params.pageSize !== undefined) {
                httpParams = httpParams.append(
                    'pageSize',
                    params.pageSize.toString()
                );
            }
        }

        return this.http.get<PaginatedData<LeaseAgreeementDTO>>(
            `${this.apiUrl}/lease-agreement/admin/land/active/p/${adminId}`,
            { params: httpParams }
        );
    }
    GetAllPendingLandLeaseByAdminPaginated(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<LeaseAgreeementDTO>> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.pageNo !== undefined) {
                httpParams = httpParams.append(
                    'pageNo',
                    params.pageNo.toString()
                );
            }
            if (params.pageSize !== undefined) {
                httpParams = httpParams.append(
                    'pageSize',
                    params.pageSize.toString()
                );
            }
        }

        return this.http.get<PaginatedData<LeaseAgreeementDTO>>(
            `${this.apiUrl}/lease-agreement/admin/land/pending/p/${adminId}`,
            { params: httpParams }
        );
    }
    GetAllUpcomingExpirationLandLeaseByAdminPaginated(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<LeaseAgreeementDTO>> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.pageNo !== undefined) {
                httpParams = httpParams.append(
                    'pageNo',
                    params.pageNo.toString()
                );
            }
            if (params.pageSize !== undefined) {
                httpParams = httpParams.append(
                    'pageSize',
                    params.pageSize.toString()
                );
            }
        }

        return this.http.get<PaginatedData<LeaseAgreeementDTO>>(
            `${this.apiUrl}/lease-agreement/admin/land/upcoming-expiration/p/${adminId}`,
            { params: httpParams }
        );
    }

    //END LAND LEASE

    // BUILDING LEASE
    GetAllBuildingLeaseByAdminPaginated(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<LeaseAgreeementDTO>> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.pageNo !== undefined) {
                httpParams = httpParams.append(
                    'pageNo',
                    params.pageNo.toString()
                );
            }
            if (params.pageSize !== undefined) {
                httpParams = httpParams.append(
                    'pageSize',
                    params.pageSize.toString()
                );
            }
        }

        return this.http.get<PaginatedData<LeaseAgreeementDTO>>(
            `${this.apiUrl}/lease-agreement/admin/building/p/${adminId}`,
            { params: httpParams }
        );
    }
    GetAllActiveBuildingLeaseByAdminPaginated(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<LeaseAgreeementDTO>> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.pageNo !== undefined) {
                httpParams = httpParams.append(
                    'pageNo',
                    params.pageNo.toString()
                );
            }
            if (params.pageSize !== undefined) {
                httpParams = httpParams.append(
                    'pageSize',
                    params.pageSize.toString()
                );
            }
        }

        return this.http.get<PaginatedData<LeaseAgreeementDTO>>(
            `${this.apiUrl}/lease-agreement/admin/building/active/p/${adminId}`,
            { params: httpParams }
        );
    }
    GetAllPendingBuildingLeaseByAdminPaginated(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<LeaseAgreeementDTO>> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.pageNo !== undefined) {
                httpParams = httpParams.append(
                    'pageNo',
                    params.pageNo.toString()
                );
            }
            if (params.pageSize !== undefined) {
                httpParams = httpParams.append(
                    'pageSize',
                    params.pageSize.toString()
                );
            }
        }

        return this.http.get<PaginatedData<LeaseAgreeementDTO>>(
            `${this.apiUrl}/lease-agreement/admin/building/pending/p/${adminId}`,
            { params: httpParams }
        );
    }
    GetAllUpcomingExpirationBuildingLeaseByAdminPaginated(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<LeaseAgreeementDTO>> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.pageNo !== undefined) {
                httpParams = httpParams.append(
                    'pageNo',
                    params.pageNo.toString()
                );
            }
            if (params.pageSize !== undefined) {
                httpParams = httpParams.append(
                    'pageSize',
                    params.pageSize.toString()
                );
            }
        }

        return this.http.get<PaginatedData<LeaseAgreeementDTO>>(
            `${this.apiUrl}/lease-agreement/admin/building/upcoming-expiration/p/${adminId}`,
            { params: httpParams }
        );
    }

    //END BUILDING LEASE

    GetAllUpcomingExpiryLeaseByAdminPaginated(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<LeaseAgreeementDTO>> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.pageNo !== undefined) {
                httpParams = httpParams.append(
                    'pageNo',
                    params.pageNo.toString()
                );
            }
            if (params.pageSize !== undefined) {
                httpParams = httpParams.append(
                    'pageSize',
                    params.pageSize.toString()
                );
            }
        }

        return this.http.get<PaginatedData<LeaseAgreeementDTO>>(
            `${this.apiUrl}/lease-agreement/admin/upcoming-expiry/p/${adminId}`,
            { params: httpParams }
        );
    }

    GetLeaseAgreementDetailed(
        leaseAgreementId: number
    ): Observable<LeaseAgreeementDTO> {
        return this.http.get<LeaseAgreeementDTO>(
            `${this.apiUrl}/lease-agreement/${leaseAgreementId}`
        );
    }

    RenewLeaseAgreementWithSameTerms(
        leaseAgreementId: number,
        leaseEndDate: string,
        leaseDurationMonths: string
    ) {
        return this.http.get(
            `${this.apiUrl}/lease-agreement/renewal/same/${leaseAgreementId}/${leaseEndDate}/${leaseDurationMonths}`
        );
    }

    OwnerTerminateLeaseAgreement(data: LeaseModificationDTO) {
        console.log('FONRTENT TERMINATING LEASE', data);
        return this.http.post(
            `${this.apiUrl}/lease-agreement/terminate/owner`,
            data
        );
    }
    TenantTerminateLeaseAgreement(data: LeaseModificationDTO) {
        return this.http.post(
            `${this.apiUrl}/lease-agreement/terminate/tenant`,
            data
        );
    }

    CheckUnitEligibilityForLease(unitId: number) {
        return this.http.get(
            `${this.apiUrl}/lease-agreement/validate/unit/${unitId}`
        );
    }

    CheckPlotEligibilityForLease(plotDatabaseId: number) {
        //not the plotID(SM1-12) but the database plotID
        return this.http.get(
            `${this.apiUrl}/lease-agreement/validate/plot/${plotDatabaseId}`
        );
    }

    CheckBuildingligibilityForLease(buildingId: number) {
        return this.http.get(
            `${this.apiUrl}/lease-agreement/validate/building/${buildingId}`
        );
    }

    CreateLeaseAgreement(
        data: CreateLeaseAgreementDTO
    ): Observable<LeaseAgreeementDTO> {
        return this.http.post<LeaseAgreeementDTO>(
            `${this.apiUrl}/lease-agreement`,
            data
        );
    }

    GetLeaseAgreementsPaginated(params?: PaginatedParamsOptions) {
        // let httpParams = new HttpParams();
        // if (params) {
        //     if (params.page !== undefined) {
        //         httpParams = httpParams.append('page', params.page.toString());
        //     }
        //     if (params.limit !== undefined) {
        //         httpParams = httpParams.append(
        //             'limit',
        //             params.limit.toString()
        //         );
        //     }
        // }
        // return this.http.get<PaginatedData<LeaseAgreementDTO>>(
        //     `${this.apiUrl}/lease-agreement`,
        //     { params: httpParams }
        // );
    }

    GetAllLeaseAgreementsByUnitPaginated(
        unitId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<LeaseAgreeementDTO>> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.pageNo !== undefined) {
                httpParams = httpParams.append(
                    'pageNo',
                    params.pageNo.toString()
                );
            }
            if (params.pageSize !== undefined) {
                httpParams = httpParams.append(
                    'pageSize',
                    params.pageSize.toString()
                );
            }
        }

        return this.http.get<PaginatedData<LeaseAgreeementDTO>>(
            `${this.apiUrl}/lease-agreement/unit/p/${unitId}`,
            { params: httpParams }
        );
    }

    GetActiveLeaseAgreementByUnit(
        unitId: number
    ): Observable<LeaseAgreeementDTO> {
        return this.http.get<LeaseAgreeementDTO>(
            `${this.apiUrl}/lease-agreement/active/unit/${unitId}`
        );
    }

    findLandLeasePaymentStatusByAdminAndYear(
        adminId: number,
        year: number
    ): Observable<LandLeasePaymentStatusDTO[]> {
        return this.http.get<LandLeasePaymentStatusDTO[]>(
            `${this.apiUrl}/lease-agreement/payment-status/land/admin/${adminId}/${year}`
        );
    }

    findBuildingLeasePaymentStatusByAdminAndYear(
        adminId: number,
        year: number
    ): Observable<BuildingLeasePaymentStatusDTO[]> {
        return this.http.get<BuildingLeasePaymentStatusDTO[]>(
            `${this.apiUrl}/lease-agreement/payment-status/building/admin/${adminId}/${year}`
        );
    }

    findUnitLeasePaymentStatusByAdminAndYear(
        adminId: number,
        year: number
    ): Observable<UnitLeasePaymentStatusDTO[]> {
        return this.http.get<UnitLeasePaymentStatusDTO[]>(
            `${this.apiUrl}/lease-agreement/payment-status/unit/admin/${adminId}/${year}`
        );
    }

    GetActiveLeaseAgreementsByTenant(
        tenantId: number
    ): Observable<LeaseAgreeementDTO[]> {
        return this.http.get<LeaseAgreeementDTO[]>(
            `${this.apiUrl}/lease-agreement/active/tenant/${tenantId}`
        );
    }

    GetUpcomingExpirationLeaseAgreementsByTenant(
        tenantId: number
    ): Observable<LeaseAgreeementDTO[]> {
        return this.http.get<LeaseAgreeementDTO[]>(
            `${this.apiUrl}/lease-agreement/upcoming-expiry/tenant/${tenantId}`
        );
    }

    GetPendingLeaseAgreementsByTenant(
        tenantId: number
    ): Observable<LeaseAgreeementDTO[]> {
        return this.http.get<LeaseAgreeementDTO[]>(
            `${this.apiUrl}/lease-agreement/pending/tenant/${tenantId}`
        );
    }

    GetAllNonActiveLeaseByTenantPaginated(
        tenantId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<LeaseAgreeementDTO>> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.pageNo !== undefined) {
                httpParams = httpParams.append(
                    'pageNo',
                    params.pageNo.toString()
                );
            }
            if (params.pageSize !== undefined) {
                httpParams = httpParams.append(
                    'pageSize',
                    params.pageSize.toString()
                );
            }
        }

        return this.http.get<PaginatedData<LeaseAgreeementDTO>>(
            `${this.apiUrl}/lease-agreement/lease-hisotry/non-active/tenant/p/${tenantId}`,
            { params: httpParams }
        );
    }

    GetAllActiveLeaseAgreementsByPlot(
        plotDatabaseId: number
    ): Observable<LeaseAgreeementDTO[]> {
        return this.http.get<LeaseAgreeementDTO[]>(
            `${this.apiUrl}/lease-agreement/active/plot/${plotDatabaseId}`
        );
    }

    GetAllUpcomingExpirationLeaseAgreementsByPlot(
        plotDatabaseId: number
    ): Observable<LeaseAgreeementDTO[]> {
        return this.http.get<LeaseAgreeementDTO[]>(
            `${this.apiUrl}/lease-agreement/upcoming-expiry/plot/${plotDatabaseId}`
        );
    }

    GetAllPendingLeaseAgreementsByPlot(
        plotDatabaseId: number
    ): Observable<LeaseAgreeementDTO[]> {
        return this.http.get<LeaseAgreeementDTO[]>(
            `${this.apiUrl}/lease-agreement/pending/plot/${plotDatabaseId}`
        );
    }

    GetAllNonActiveLeaseByPlotPaginated(
        plotDatabaseId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<LeaseAgreeementDTO>> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.pageNo !== undefined) {
                httpParams = httpParams.append(
                    'pageNo',
                    params.pageNo.toString()
                );
            }
            if (params.pageSize !== undefined) {
                httpParams = httpParams.append(
                    'pageSize',
                    params.pageSize.toString()
                );
            }
        }

        return this.http.get<PaginatedData<LeaseAgreeementDTO>>(
            `${this.apiUrl}/lease-agreement/lease-hisotry/non-active/plot/p/${plotDatabaseId}`,
            { params: httpParams }
        );
    }

    CheckPropertyAvailabilityForLease(
        data: PropertyLeaseAvailabiltyCheckerDTO
    ): Observable<PropertyLeaseAvailabilityCheckerReturnDTO> {
        return this.http.post<PropertyLeaseAvailabilityCheckerReturnDTO>(
            `${this.apiUrl}/lease-agreement/admin/check-availability`,
            data
        );
    }

    CheckPropertyPaymentDue(
        data: PropertyLeaseOverDueCalculatorDTO
    ): Observable<PropertyLeaseOverDueReturnDTO> {
        return this.http.post<PropertyLeaseOverDueReturnDTO>(
            `${this.apiUrl}/lease-agreement/admin/get-dues`,
            data
        );
    }

    //LEASE AGREEMENT ATTACHMENT
    UploadLeaseAgreementAttachment(
        data: FormData
    ): Observable<LeaseAgreementAttachmentDTO> {
        return this.http.post<LeaseAgreementAttachmentDTO>(
            `${this.apiUrl}/lease-attachment/upload`,
            data
        );
    }

    ReUploadLeaseAgreementAttachment(
        data: FormData
    ): Observable<LeaseAgreementAttachmentDTO> {
        return this.http.post<LeaseAgreementAttachmentDTO>(
            `${this.apiUrl}/lease-attachment/re-upload/signed-copy`,
            data
        );
    }

    GetSignedLeaseAgreementCopy(
        leaseAgreementId: number
    ): Observable<LeaseAgreementAttachmentDTO> {
        return this.http.get<LeaseAgreementAttachmentDTO>(
            `${this.apiUrl}/lease-attachment/signed-copy/${leaseAgreementId}`
        );
    }
}
