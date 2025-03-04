import { Component, Input, OnInit } from '@angular/core';
import { GalleriaModule } from 'primeng/galleria';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BuildingImageDataService } from 'src/app/core/dataservice/building/building-image.dataservice';
import { API_URL } from 'src/app/core/constants/constants';
import { BuildingImageDTO } from 'src/app/core/dto/properties/building-image.dto';
import { ImageModule } from 'primeng/image';
import { FileUploadModule } from 'primeng/fileupload';
import { CarouselModule } from 'primeng/carousel';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';

interface UploadQueueItem {
    file: File;
    status: 'Pending' | 'In Progress' | 'Uploaded' | 'Failed';
}
@Component({
    selector: 'app-admin-building-photos',
    templateUrl: './admin-building-photos.component.html',
    styleUrls: ['./admin-building-photos.component.scss'],
    standalone: true,
    imports: [
        GalleriaModule,
        ButtonModule,
        ImageModule,
        FileUploadModule,
        ConfirmDialogModule,
        CarouselModule,
        DialogModule,
    ],
    providers: [ConfirmationService],
})
export class AdminBuildingPhotosComponent implements OnInit {
    @Input({ required: true }) buildingId: number;
    @Input({ required: true }) editMode: boolean;

    uploadQueue: UploadQueueItem[] = [];
    buildingImages: BuildingImageDTO[] = [];
    selectedFile: File | null = null;
    selectedBuildingImage: BuildingImageDTO | null = null;

    showPreviewBuildingImage: boolean = false;

    constructor(
        private buildingImageService: BuildingImageDataService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.getBuildingImages();
    }

    getBuildingImages() {
        this.buildingImageService
            .GetBuildingImageByBuilding(this.buildingId)
            .subscribe((res) => {
                this.buildingImages = res;
            });
    }

    getBuildingImageUrl(item: BuildingImageDTO) {
        return API_URL + '/' + item.uri;
    }

    onFileSelected(event: any, fileUpload: any) {
        this.selectedFile = event.files[0];
        this.uploadQueue.push({
            file: this.selectedFile,
            status: 'Pending',
        });
        this.uploadImage(this.selectedFile, fileUpload); // Pass fileUpload reference to the method
    }

    async uploadImage(file: File, fileUpload: any) {
        const queueItem = this.uploadQueue.find(
            (item) =>
                item.file.name === file.name && item.file.size === file.size
        );

        if (!queueItem) return;

        queueItem.status = 'In Progress';

        const formData = new FormData();
        formData.append('file', file);
        formData.append('buildingId', this.buildingId.toString());
        fileUpload.clear();
        try {
            await this.buildingImageService
                .CreateBuildingImage(formData)
                .toPromise();
            queueItem.status = 'Uploaded';

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `${file.name} uploaded successfully.`,
            });

            // Refresh the list of plot images
            this.getBuildingImages();
        } catch (error) {
            queueItem.status = 'Failed';
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: `Failed to upload ${file.name}.`,
            });
        }
    }

    confirmDeletePhoto(item: BuildingImageDTO) {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Do you want to delete this Image?',
            header: 'Delete Confirmation',
            icon: 'pi pi-info-circle',
            acceptButtonStyleClass: 'p-button-danger p-button-text',
            rejectButtonStyleClass: 'p-button-text p-button-text',
            acceptIcon: 'none',
            rejectIcon: 'none',

            accept: () => {
                this.buildingImageService
                    .DeleteBuildingImage(item.id)
                    .subscribe((res) => {
                        if (res) {
                            this.messageService.add({
                                severity: 'info',
                                summary: 'Confirmed',
                                detail: 'Record deleted',
                            });
                            this.getBuildingImages();
                        }
                    });
            },
        });
    }

    previewImage(image: BuildingImageDTO) {
        this.showPreviewBuildingImage = true;
        this.selectedBuildingImage = image;
    }
}
