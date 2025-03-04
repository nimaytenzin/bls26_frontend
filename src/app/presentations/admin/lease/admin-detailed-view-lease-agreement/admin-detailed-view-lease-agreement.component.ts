import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
    DynamicDialogRef,
    DynamicDialogConfig,
    DialogService,
} from 'primeng/dynamicdialog';
import {
    LEASEATTACHMENTTYPES,
    LEASESTATUS,
    LEASETYPE,
    LESSEETYPE,
    LESSORTYPE,
    NOTIFICATIONTYPES,
} from 'src/app/core/constants/enums';
import { DamageItemService } from 'src/app/core/dataservice/damage-item/damage-item.dataservice';
import { DamageItemDTO } from 'src/app/core/dataservice/damage-item/damage.item.dto';
import { LeaseAgreementDataService } from 'src/app/core/dataservice/lease/lease-agreement.dataservice';
import {
    LeaseAgreeementDTO,
    LeaseAgreementAttachmentDTO,
} from 'src/app/core/dataservice/lease/lease-agreement.dto';
import { LeaseSurchargeDTO } from 'src/app/core/dataservice/lease/lease-surcharge.dto';
import {
    NotificationDTO,
    NotificationService,
} from 'src/app/core/dataservice/notification/notification.service';
import { PDFGeneratorDataService } from 'src/app/core/dataservice/pdf.generator.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { GETMONTHNAME, GETMONTHDIFF } from 'src/app/core/utility/date.helper';
import { GETUNITCONFIGSTRING } from 'src/app/core/utility/helper.function';
import { ToWords } from 'to-words';
import { AdminLeaseCreateEntryDamageItemModalComponent } from '../components/admin-lease-create-entry-damage-item-modal/admin-lease-create-entry-damage-item-modal.component';
import { AdminLeaseResolveDamageItemModalComponent } from '../components/admin-lease-resolve-damage-item-modal/admin-lease-resolve-damage-item-modal.component';
import { DividerModule } from 'primeng/divider';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TabViewChangeEvent, TabViewModule } from 'primeng/tabview';
import { ActivatedRoute, Router } from '@angular/router';
import { GalleriaModule } from 'primeng/galleria';
import { image } from 'html2canvas/dist/types/css/types/image';
import { DamageItemChatBoxComponent } from '../components/damage-item-chat-box/damage-item-chat-box.component';
import { AdminTabPreferenceService } from 'src/app/core/preferences/admin.tab.selection.preferences';
import { ImageModule } from 'primeng/image';
import { UserDTO } from 'src/app/core/dataservice/users-and-auth/dto/user.dto';
import * as L from 'leaflet';
import { GeometryDataService } from 'src/app/core/dataservice/geometry/geometry.dataservice';
import { ChipModule } from 'primeng/chip';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { AdminLeasePaymentsComponent } from '../components/admin-lease-payments/admin-lease-payments.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PaginatedData } from 'src/app/core/dto/paginated-data.dto';
import { AdminLeaseNotificationsComponent } from '../components/admin-lease-notifications/admin-lease-notifications.component';
import { TooltipModule } from 'primeng/tooltip';
import { API_URL } from 'src/app/core/constants/constants';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { AdminViewPaymentReceiptModalComponent } from '../../transactions/shared-components/admin-view-payment-receipt-modal/admin-view-payment-receipt-modal.component';
import { FileUploadModule } from 'primeng/fileupload';

@Component({
    selector: 'app-admin-detailed-view-lease-agreement',
    templateUrl: './admin-detailed-view-lease-agreement.component.html',
    styleUrls: ['./admin-detailed-view-lease-agreement.component.css'],
    standalone: true,
    imports: [
        ButtonModule,
        DividerModule,
        CommonModule,
        TabViewModule,
        ConfirmDialogModule,
        DialogModule,
        InputTextareaModule,
        FormsModule,
        GalleriaModule,
        DamageItemChatBoxComponent,
        CalendarModule,
        ImageModule,
        ChipModule,
        PdfViewerModule,
        AdminLeasePaymentsComponent,
        ProgressSpinnerModule,
        AdminLeaseNotificationsComponent,
        TooltipModule,
        FileUploadModule,
    ],
    providers: [ConfirmationService, DialogService],
})
export class AdminDetailedViewLeaseAgreementComponent implements OnInit {
    ref: DynamicDialogRef | undefined;

    showPdfLoading: boolean = true;

    pageTitle: string;

    leaseTypeEnums = LEASETYPE;
    lesseeTypeEnums = LESSEETYPE;
    lessorTypes = LESSORTYPE;
    leaseStatus = LEASESTATUS;
    securityDepositPA: PaymentAdviceDto | null = null;

    leaseAgreement: LeaseAgreeementDTO;
    leaseAgreementId: number;
    leaseCharges: LeaseSurchargeDTO[] = [];
    totalMonthlyPayable = 0;

    showTerminateLeaseModal: boolean = false;
    leaseModificationDate = new Date();
    leaseModificationRemarks: string;

    showRenewLeaseModal: boolean = false;
    newLeaseEndDate = new Date();

    getUnitConfigString = GETUNITCONFIGSTRING;
    getMonthName = GETMONTHNAME;
    calculateMonthsDifference = GETMONTHDIFF;
    tenantSignatureUri: string;
    admin: UserDTO;

    entryDamageReportItems: DamageItemDTO[] = [];
    maintenanceRequestItems: DamageItemDTO[] = [];

    activeIndex: number;

    selectedDamageItem: DamageItemDTO | null = null;
    leaseTerminated: boolean = false;

    //MAP
    cartoLightUrl =
        'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
    googleSatUrl = 'http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}';
    map!: L.Map;
    plotsGeojsonLayer: L.GeoJSON;
    buildingsGeoJsonLayer: L.GeoJSON;

    pdfSrc: string;

    showUploadSignedCopyModal: boolean = false;
    selectedSignedPdfFile: File | null = null;
    signedLeaseAgreement: LeaseAgreementAttachmentDTO | null = null;
    showReUploadSignedCopyModal: boolean = false;

    fileUpload: any;

    constructor(
        private pdfGeneratorDataService: PDFGeneratorDataService,
        private messageService: MessageService,
        private authService: AuthService,
        private leaseAgreemenetDataService: LeaseAgreementDataService,
        private notificationService: NotificationService,
        private dialogService: DialogService,
        private damageItemService: DamageItemService,
        private route: ActivatedRoute,
        private adminTabSelectionPreferenceService: AdminTabPreferenceService,
        private confirmationService: ConfirmationService,
        private geometryDataService: GeometryDataService,
        private paymentAdviceDataService: PaymentAdviceDataService,
        private router: Router
    ) {
        this.leaseAgreementId = Number(
            this.route.snapshot.paramMap.get('leaseAgreementId')
        );

        this.getSignedLeaseAgreementCopy();

        this.adminTabSelectionPreferenceService.adminViewLeaseDetailedSelectedTabIndex$.subscribe(
            (tabIndex) => {
                this.activeIndex = tabIndex;
            }
        );
        this.authService
            .GetAdminDetails(this.authService.GetCurrentRole().adminId)
            .subscribe((res) => {
                this.admin = res;
            });
    }
    ngAfterViewInit(): void {}

    ngOnInit() {
        this.getLeaseAgreementDetails();
        this.getEntryDamageItems();
        this.getMaintenanceRequestItems();
    }

    getLeaseAgreementDetails() {
        this.leaseAgreemenetDataService
            .GetLeaseAgreementDetailed(this.leaseAgreementId)
            .subscribe({
                next: (res) => {
                    this.leaseAgreement = res;
                    this.leaseCharges = this.leaseAgreement.leaseSurcharges;
                    this.newLeaseEndDate = new Date(
                        this.leaseAgreement.leaseEndDate
                    );

                    this.totalMonthlyPayable = Number(this.leaseAgreement.rent);
                    this.leaseCharges.forEach((item) => {
                        this.totalMonthlyPayable += item.amount;
                    });
                    if (this.leaseAgreement.securityDepositPaid) {
                        this.paymentAdviceDataService
                            .GetSecurityDepositPADetailsByLease(
                                this.leaseAgreementId
                            )
                            .subscribe((res) => {
                                this.securityDepositPA = res;
                            });
                    }

                    if (
                        this.leaseAgreement.status ===
                            LEASESTATUS.TERMINATED_BY_OWNER ||
                        this.leaseAgreement.status ===
                            LEASESTATUS.TERMINATED_BY_TENANT ||
                        this.leaseAgreement.status === LEASESTATUS.SUSPENDED ||
                        this.leaseAgreement.status === LEASESTATUS.CANCELLED
                    ) {
                        this.leaseTerminated = true;
                    }

                    switch (this.leaseAgreement.type) {
                        case LEASETYPE.UNIT:
                            this.pageTitle = `Lease Agreement for Unit ${this.leaseAgreement.unit.floorLevel}-${this.leaseAgreement.unit.unitNumber} on building ${this.leaseAgreement.building.buildingNumber}`;
                            break;
                        case LEASETYPE.BUILDING:
                            this.pageTitle = `Lease Agreement for Building ${this.leaseAgreement.building.name}(${this.leaseAgreement.building.buildingNumber})`;
                            break;
                        case LEASETYPE.LAND:
                            this.pageTitle = `Lease Agreement for Plot ${this.leaseAgreement.plot.plotId}`;
                            break;
                        default:
                            this.pageTitle = 'Lease Agreement';
                    }

                    this.renderMap();
                },
            });
    }

    goToTenantDetailedView(tenantId: number) {
        this.router.navigate([`/admin/master-users/tenant/${tenantId}`]);
    }

    openPRDetails() {
        this.ref = this.dialogService.open(
            AdminViewPaymentReceiptModalComponent,
            {
                header: 'Receipt',
                data: {
                    paymentReceiptId:
                        this.securityDepositPA.paymentReceipts[0].id,
                },
            }
        );
    }

    getEntryDamageItems() {
        this.damageItemService
            .GetEntryDamageItemsBylease(this.leaseAgreementId)
            .subscribe({
                next: (res) => {
                    this.entryDamageReportItems = res;

                    this.entryDamageReportItems.forEach((item) => {
                        item.images = this.parseEntryDamageItemImages(item);
                    });
                },
                error: (err) => {
                    console.log(err);
                },
            });
    }

    onProgress(event) {}

    loadChat(item: DamageItemDTO) {
        this.selectedDamageItem = item;
    }

    parseEntryDamageItemImages(item: DamageItemDTO) {
        let images = [];

        // Loop through damageItemImages and construct the objects
        for (let image of item.damageItemImages) {
            let obj = {
                itemImageSrc: API_URL + image.uri, // Adjust URL as necessary
            };
            images.push(obj);
        }

        // Return the array of image objects
        return images;
    }
    getMaintenanceRequestItems() {
        this.damageItemService
            .GetMaintenanceItemsBylease(this.leaseAgreementId)
            .subscribe({
                next: (res) => {
                    this.maintenanceRequestItems = res;
                    this.maintenanceRequestItems.forEach((item) => {
                        item.images = this.parseEntryDamageItemImages(item);
                    });
                },
                error: (err) => {
                    console.log(err);
                },
            });
    }

    formatDateString(d: string) {
        return new Date(d);
    }

    getWords(number: number) {
        const toWords = new ToWords({
            localeCode: 'en-IN',
            converterOptions: {
                currency: true,
                ignoreDecimal: false,
                ignoreZeroCurrency: false,
                doNotAddOnly: false,
                currencyOptions: {
                    name: 'Ngultrum',
                    plural: 'Ngultrum',
                    symbol: 'Nu.',
                    fractionalUnit: {
                        name: 'Chetrum',
                        plural: 'Chetrums',
                        symbol: '',
                    },
                },
            },
        });

        return toWords.convert(number);
    }

    openConfirmLeaseTerminationModal() {
        this.showTerminateLeaseModal = true;
    }
    confirmLeaseTermination() {
        if (!this.leaseModificationDate || !this.leaseModificationRemarks) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Input',
                detail: 'Please enter both lease termination date and remarks',
                life: 3000,
            });
            return;
        }
        this.messageService.add({
            severity: 'info',
            summary: 'Terminating Lease',
            detail: 'terminating lease...',
            life: 3000,
        });

        this.leaseAgreemenetDataService
            .OwnerTerminateLeaseAgreement({
                leaseModificationRemarks: this.leaseModificationRemarks,
                leaseModificationDate:
                    this.leaseModificationDate.toDateString(),
                leaseAgreementId: this.leaseAgreement.id,
            })
            .subscribe({
                next: (res) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Lease Terminated',
                        detail: 'Lease has been Terminated',
                        life: 3000,
                    });
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Sending Notification',
                        detail: 'Sending Lease Termination Notification....',
                        life: 3000,
                    });
                    this.getLeaseAgreementDetails();

                    this.notificationService
                        .SendNotification({
                            fromUserId:
                                this.authService.GetCurrentRole().adminId,
                            toUserId: this.leaseAgreement.tenantId,
                            notificationType:
                                NOTIFICATIONTYPES.LEASE_TERMINATION,
                            leaseAgreementId: this.leaseAgreement.id,
                        })
                        .subscribe({
                            next: (resp) => {
                                if (resp) {
                                    this.messageService.add({
                                        severity: 'success',
                                        summary: 'Sent',
                                        detail: 'Lease Termination Notification Sent.',
                                        life: 3000,
                                    });
                                }
                            },
                            error: (error) => {
                                this.messageService.add({
                                    severity: 'error',
                                    summary: 'Error',
                                    detail: error.error.message,
                                    life: 3000,
                                });
                            },
                        });
                },
                error: (err) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'error',
                        detail: err.error.message,
                        life: 3000,
                    });
                },
            });

        this.showTerminateLeaseModal = false;
    }
    openRenewLeaseModal() {
        if (!this.leaseAgreement.leaseSigningDate) {
            this.messageService.add({
                severity: 'error',
                summary: 'Not Active',
                detail: 'Lease is Not yet Active',
                life: 3000,
            });
            return;
        }
        this.showRenewLeaseModal = true;
    }
    confirmLeaseRenewal() {
        const leaseDuationMonths = this.calculateMonthsDifference(
            new Date(this.leaseAgreement.leaseStartDate),
            this.newLeaseEndDate
        );
        this.messageService.add({
            severity: 'info',
            summary: 'Renewing',
            detail: 'Renweing lease...',
            life: 3000,
        });

        this.leaseAgreemenetDataService
            .RenewLeaseAgreementWithSameTerms(
                this.leaseAgreement.id,
                this.formatDate(this.newLeaseEndDate),
                leaseDuationMonths.toString()
            )
            .subscribe({
                next: (res) => {
                    console.log(res);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Lease Renewed',
                        detail: 'Lease has been Renewed',
                        life: 3000,
                    });
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Sending Notification',
                        detail: 'Sending Lease Renewal Notification....',
                        life: 3000,
                    });

                    this.notificationService
                        .SendNotification({
                            fromUserId:
                                this.authService.GetAuthenticatedUser().id,
                            toUserId: this.leaseAgreement.tenantId,
                            notificationType: NOTIFICATIONTYPES.LEASE_RENEWAL,
                            leaseAgreementId: this.leaseAgreement.id,
                        })
                        .subscribe({
                            next: (res) => {
                                if (res) {
                                    this.messageService.add({
                                        severity: 'success',
                                        summary: 'Sent',
                                        detail: 'Lease Renewal Sent.',
                                        life: 3000,
                                    });
                                }
                            },
                            error: (err) => {
                                this.messageService.add({
                                    severity: 'error',
                                    summary: 'Error',
                                    detail: err.error.message,
                                    life: 3000,
                                });
                            },
                        });
                },
                error: (err) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'error',
                        detail: err.error.message,
                        life: 3000,
                    });
                },
            });
        this.showRenewLeaseModal = false;
    }

    formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are 0-based
        const day = ('0' + date.getDate()).slice(-2);

        return `${year}-${month}-${day}`;
    };

    downloadLeasePdf() {
        this.messageService.add({
            severity: 'info',
            summary: 'Downloading',
            detail: 'downloading...',
        });
        this.pdfGeneratorDataService
            .DownloadLeaseAgreementPdf(this.leaseAgreement.id)
            .subscribe((blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'lease-agreement.pdf';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Downloaded',
                    detail: 'Lease has been downloaded.Please check your downloads.',
                    life: 3000,
                });
            });
    }

    openCreateEntryDamageItem() {
        this.ref = this.dialogService.open(
            AdminLeaseCreateEntryDamageItemModalComponent,
            {
                header: 'Entry Damage report',
                data: { ...this.leaseAgreement },
            }
        );
        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 201) {
                console.log('GETTING OK');
                this.getEntryDamageItems();
            }
        });
    }

    openResolveDamageItemModal(item: DamageItemDTO) {
        this.ref = this.dialogService.open(
            AdminLeaseResolveDamageItemModalComponent,
            {
                header: 'Resolve Damage Item',
                data: {
                    ...item,
                },
            }
        );
        this.ref.onClose.subscribe((res) => {
            console.log('CLOSE', res);
            if (res && res.status === 200) {
                this.notificationService.SendNotification({
                    fromUserId: this.authService.GetAuthenticatedUser().id,
                    toUserId: this.leaseAgreement.tenantId,
                    damageItemId: item.id,
                    notificationType: NOTIFICATIONTYPES.DAMAGEITEM_RESOLUTION,
                });
                this.getMaintenanceRequestItems();
            }
        });
    }

    handleTabChange(event: TabViewChangeEvent) {
        this.adminTabSelectionPreferenceService.updateAdminDetailedLeaseSelectedTab(
            event.index
        );
    }

    pdfLoaded() {
        this.showPdfLoading = false;
    }

    renderMap() {
        var satelliteMap = L.tileLayer(this.googleSatUrl, {
            maxNativeZoom: 21,
            maxZoom: 24,
        });

        this.map = L.map('leaseDetailedMap', {
            layers: [satelliteMap],
            zoomControl: false,
            attributionControl: false,
            maxZoom: 22,
            renderer: L.canvas({ tolerance: 3 }),
        }).setView([27.43503, 89.651983], 15);

        this.loadPlotGeometry();
    }

    loadPlotGeometry() {
        this.geometryDataService
            .GetPlotsGeomByPlotIdCsv(this.leaseAgreement.plot.plotId)
            .subscribe((res: any) => {
                console.log(res);
                this.plotsGeojsonLayer = L.geoJSON(res, {
                    style: (feature) => {
                        return {
                            fillColor: 'transparent',
                            weight: 2,
                            opacity: 1,
                            color: 'red',
                        };
                    },
                }).addTo(this.map);
                this.map.fitBounds(this.plotsGeojsonLayer.getBounds());
                this.messageService.add({
                    severity: 'success',
                    summary: 'Plot Details Found',
                    detail: 'Plot added to the map',
                });
                // this.loadBuildingGeometry();
            });
    }

    loadBuildingGeometry() {
        this.geometryDataService.GetAllBuildingsGeom().subscribe((res: any) => {
            this.buildingsGeoJsonLayer = L.geoJSON(res, {
                style: (feature) => {
                    return {
                        fillColor: 'white',
                        weight: 2,
                        opacity: 1,
                        color: 'yellow',
                    };
                },
            }).addTo(this.map);
            this.messageService.add({
                severity: 'success',
                summary: 'Building Details Found',
                detail: 'Buildings added to the map',
            });
        });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case LEASESTATUS.PENDING:
                return 'bg-red-600 text-gray-100';
            case LEASESTATUS.ACTIVE:
                return 'bg-green-600 text-gray-100';
            case LEASESTATUS.UPCOMING_EXPIRATION:
                return 'bg-yellow-600 text-gray-100';
            case LEASESTATUS.EXPIRED:
                return 'bg-red-600 text-gray-100';
            default:
                return 'bg-gray-600 text-gray-100';
        }
    }

    onLeaseSignedCopyFileSelected(event: any, fileUpload: any) {
        this.selectedSignedPdfFile = event.files[0];
        this.fileUpload = fileUpload;
    }

    async uploadLeaseSignedCopy() {
        const formData = new FormData();
        formData.append('file', this.selectedSignedPdfFile);
        formData.append('leaseAgreementId', this.leaseAgreementId.toString());
        formData.append('type', LEASEATTACHMENTTYPES.SIGNED_COPY);

        this.leaseAgreemenetDataService
            .UploadLeaseAgreementAttachment(formData)
            .subscribe((res) => {
                if (res) {
                    this.getSignedLeaseAgreementCopy();
                    this.showUploadSignedCopyModal = false;
                    this.fileUpload.clear();
                }
            });
    }

    async reuploadSignedCopy() {
        const formData = new FormData();
        formData.append('file', this.selectedSignedPdfFile);
        formData.append('leaseAgreementId', this.leaseAgreementId.toString());
        formData.append('type', LEASEATTACHMENTTYPES.SIGNED_COPY);

        this.leaseAgreemenetDataService
            .ReUploadLeaseAgreementAttachment(formData)
            .subscribe((res) => {
                if (res) {
                    this.getSignedLeaseAgreementCopy();
                    this.fileUpload.clear();
                    this.showReUploadSignedCopyModal = false;
                }
            });
    }

    getSignedLeaseAgreementCopy() {
        this.leaseAgreemenetDataService
            .GetSignedLeaseAgreementCopy(this.leaseAgreementId)
            .subscribe((res) => {
                if (res) {
                    this.signedLeaseAgreement = res;
                    this.pdfSrc = API_URL + '/' + res.uri;
                } else {
                    this.pdfSrc = this.pdfGeneratorDataService.GetPdfUrl(
                        this.leaseAgreementId
                    );
                }
            });
    }
}
