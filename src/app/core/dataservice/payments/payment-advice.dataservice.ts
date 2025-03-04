import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { API_URL } from '../../constants/constants';
import { CreateInvoiceDTO } from '../../dto/payments/invoice/create-invoice.dto';
import { InvoiceDTO } from '../../dto/payments/invoice/invoice.dto';
import {
    PaginatedParamsOptions,
    PaginatedData,
} from '../../dto/paginated-data.dto';
import {
    CreatePaymentAdviceDto,
    GenerateBuildingPADto,
    PaymentAdviceDto,
    PaymentAdviceSummaryDTO,
    ReceivePaymentDTO,
} from '../../dto/payments/payment-advice.dto';
import { UnitDTO } from '../../dto/units/unit.dto';
import { PaymentReceiptDTO } from '../../dto/payments/payment-receipt-dto';

@Injectable({
    providedIn: 'root',
})
export class PaymentAdviceDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    CreatePaymentAdvice(
        data: CreatePaymentAdviceDto
    ): Observable<PaymentAdviceDto> {
        return this.http.post<PaymentAdviceDto>(
            `${this.apiUrl}/payment-advice`,
            data
        );
    }

    GetPaymentAdviceSummaryByAdmin(
        adminId: number
    ): Observable<PaymentAdviceSummaryDTO> {
        return this.http.get<PaymentAdviceSummaryDTO>(
            `${this.apiUrl}/payment-advice/summary/stats/${adminId}`
        );
    }

    GetBuildingPaymentSummaryByAdmin(
        adminId: number
    ): Observable<PaymentAdviceSummaryDTO> {
        return this.http.get<PaymentAdviceSummaryDTO>(
            `${this.apiUrl}/payment-advice/summary/stats/building/${adminId}`
        );
    }

    GenerateBuildingPA(data: GenerateBuildingPADto) {
        return this.http.post(
            `${this.apiUrl}/payment-advice/generate/building`,
            data
        );
    }

    GeneratePAForLandLeaseByAdminYearAndMonth(
        adminId: number,
        month: number,
        year: number
    ) {
        return this.http.get(
            `${this.apiUrl}/payment-advice/generate/admin/land/${adminId}/${year}/${month}`
        );
    }
    GeneratePAForSingleLeaseByYearAndMonth(
        leaseAgreementId: number,
        month: number,
        year: number
    ) {
        return this.http.get(
            `${this.apiUrl}/payment-advice/generate/admin/single-lease/${leaseAgreementId}/${year}/${month}`
        );
    }

    GeneratePAForUnitLeaseByAdminYearAndMonth(
        adminId: number,
        month: number,
        year: number
    ) {
        return this.http.get(
            `${this.apiUrl}/payment-advice/generate/admin/unit/${adminId}/${year}/${month}`
        );
    }

    GetAllPendingAdviceByUnit(unitId: number): Observable<PaymentAdviceDto[]> {
        return this.http.get<PaymentAdviceDto[]>(
            `${this.apiUrl}/payment-advice/pending/unit/${unitId}`
        );
    }

    GetAllPendingAdviceByBuilding(
        buildingId: number
    ): Observable<PaymentAdviceDto[]> {
        return this.http.get<PaymentAdviceDto[]>(
            `${this.apiUrl}/payment-advice/due/building/${buildingId}`
        );
    }

    FindOne(adviceId: number): Observable<PaymentAdviceDto> {
        return this.http.get<PaymentAdviceDto>(
            `${this.apiUrl}/payment-advice/${adviceId}`
        );
    }

    GetPendingPaymentsByTenant(
        tenantId: number
    ): Observable<PaymentAdviceDto[]> {
        return this.http.get<PaymentAdviceDto[]>(
            `${this.apiUrl}/payment-advice/pending/tenant/${tenantId}`
        );
    }
    GetPaidPaymentsByTenant(tenantId: number): Observable<PaymentAdviceDto[]> {
        return this.http.get<PaymentAdviceDto[]>(
            `${this.apiUrl}/payment-advice/paid/tenant/${tenantId}`
        );
    }

    GetPaymentAdivicesByBuildingUnitsByYear(
        buildingId: number,
        year: number
    ): Observable<UnitDTO[]> {
        return this.http.get<UnitDTO[]>(
            `${this.apiUrl}/building/payment-status/${buildingId}/${year}`
        );
    }

    DownloadPaymentStatusExcel(buildingId: number): Observable<UnitDTO[]> {
        return this.http.get<UnitDTO[]>(
            `${this.apiUrl}/payment-advice/pending/report/building/${buildingId}`
        );
    }

    GetAllPendingPaymentAdviceByAdminPaginated(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<PaymentAdviceDto>> {
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

        return this.http.get<PaginatedData<PaymentAdviceDto>>(
            `${this.apiUrl}/payment-advice/admin/pending/p/${adminId}`,
            { params: httpParams }
        );
    }

    GetPendingPaymentAdivceByLeasePaginated(
        leaseAgreementId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<PaymentAdviceDto>> {
        let httpParams = new HttpParams();
        console.log('GET PA BY LEASE');
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

        return this.http.get<PaginatedData<PaymentAdviceDto>>(
            `${this.apiUrl}/payment-advice/admin/lease/pending/p/${leaseAgreementId}`,
            { params: httpParams }
        );
    }

    GetPaidPaymentAdivceByLeasePaginated(
        leaseAgreementId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<PaymentAdviceDto>> {
        let httpParams = new HttpParams();
        console.log('GET PA BY LEASE');
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

        return this.http.get<PaginatedData<PaymentAdviceDto>>(
            `${this.apiUrl}/payment-advice/admin/lease/paid/p/${leaseAgreementId}`,
            { params: httpParams }
        );
    }

    GetAllPaidPaymentAdviceByAdminPaginated(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<PaymentAdviceDto>> {
        let httpParams = new HttpParams();

        console.log(params);
        // Check if params exist and append query parameters accordingly
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

        return this.http.get<PaginatedData<PaymentAdviceDto>>(
            `${this.apiUrl}/payment-advice/admin/paid/p/${adminId}`,
            { params: httpParams }
        );
    }

    GetAllPaidPaymentAdvicePaginatedByBuilding(
        buildingId,
        params?: PaginatedParamsOptions
    ) {
        // let httpParams = new HttpParams();
        // console.log('PARAMS', params);
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
        // return this.http.get<PaginatedData<PaymentAdviceDto>>(
        //     `${this.apiUrl}/payment-advice/paid/building/${buildingId}`,
        //     { params: httpParams }
        // );
    }

    ReceivePayment(data: ReceivePaymentDTO): Observable<PaymentReceiptDTO> {
        return this.http.post<PaymentReceiptDTO>(
            `${this.apiUrl}/payment-receipt`,
            data
        );
    }

    GetSecurityDepositPADetailsByLease(
        leaseAgreementId: number
    ): Observable<PaymentAdviceDto> {
        return this.http.get<PaymentAdviceDto>(
            `${this.apiUrl}/payment-advice/admin/lease/securitydeposit-advice/${leaseAgreementId}`
        );
    }

    GetAllPaidPaymentAdvicesByUnitPaginated(
        unitId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<PaymentAdviceDto>> {
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

        return this.http.get<PaginatedData<PaymentAdviceDto>>(
            `${this.apiUrl}/payment-advice/unit/paid/p/${unitId}`,
            { params: httpParams }
        );
    }

    GetAllPendingByTenant(tenantId: number): Observable<PaymentAdviceDto[]> {
        return this.http.get<PaymentAdviceDto[]>(
            `${this.apiUrl}/payment-advice/admin/tenant/pending/${tenantId}`
        );
    }

    GetAllPaidPaymentAdvicesByTenantPaginated(
        tenantId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<PaymentAdviceDto>> {
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

        return this.http.get<PaginatedData<PaymentAdviceDto>>(
            `${this.apiUrl}/payment-advice/admin/tenant/paid/p/${tenantId}`,
            { params: httpParams }
        );
    }

    AdminGetAllPendingByPlot(
        plotDatabaseId: number
    ): Observable<PaymentAdviceDto[]> {
        return this.http.get<PaymentAdviceDto[]>(
            `${this.apiUrl}/payment-advice/admin/plot/pending/${plotDatabaseId}`
        );
    }

    AdminGetAllPaidPaymentAdvicesByPlotPaginated(
        plotDatabaseId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<PaymentAdviceDto>> {
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

        return this.http.get<PaginatedData<PaymentAdviceDto>>(
            `${this.apiUrl}/payment-advice/admin/plot/paid/p/${plotDatabaseId}`,
            { params: httpParams }
        );
    }

    //LEase types

    GetAllPendingBuildingAndUnitRentPaymentAdivcesPaginatedByAdmin(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<PaymentAdviceDto>> {
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

        return this.http.get<PaginatedData<PaymentAdviceDto>>(
            `${this.apiUrl}/payment-advice/admin/building/rent/pending/p/${adminId}`,
            { params: httpParams }
        );
    }

    GetAllPaidBuildingAndUnitRentPaymentAdivcesPaginatedByAdmin(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<PaymentAdviceDto>> {
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

        return this.http.get<PaginatedData<PaymentAdviceDto>>(
            `${this.apiUrl}/payment-advice/admin/building/rent/paid/p/${adminId}`,
            { params: httpParams }
        );
    }

    GetAllPaidBuildingAndUnitSecurityDepositPaymentAdivcesPaginatedByAdmin(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<PaymentAdviceDto>> {
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

        return this.http.get<PaginatedData<PaymentAdviceDto>>(
            `${this.apiUrl}/payment-advice/admin/building/security-deposit/paid/p/${adminId}`,
            { params: httpParams }
        );
    }
    GetAllPendingBuildingAndUnitSecurityDepositPaymentAdivcesPaginatedByAdmin(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<PaymentAdviceDto>> {
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

        return this.http.get<PaginatedData<PaymentAdviceDto>>(
            `${this.apiUrl}/payment-advice/admin/building/security-deposit/paid/p/${adminId}`,
            { params: httpParams }
        );
    }
}
