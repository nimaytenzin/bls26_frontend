import { Component, Input, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { GalleriaModule } from 'primeng/galleria';
import { ImageModule } from 'primeng/image';
import { API_URL } from 'src/app/core/constants/constants';
import { BuildingImageDataService } from 'src/app/core/dataservice/building/building-image.dataservice';
import { PlotImageDTO } from 'src/app/core/dataservice/land/dto/plot.dto';
import { PlotImageDataservice } from 'src/app/core/dataservice/land/plot-image.dataservice';
import { BuildingImageDTO } from 'src/app/core/dto/properties/building-image.dto';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';

interface UploadQueueItem {
    file: File;
    status: 'Pending' | 'In Progress' | 'Uploaded' | 'Failed';
}

@Component({
    selector: 'app-admin-plot-photos',
    templateUrl: './admin-plot-photos.component.html',
    styleUrls: ['./admin-plot-photos.component.scss'],
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
export class AdminPlotPhotosComponent implements OnInit {
    @Input({ required: true }) plotDatabaseId: number;
    @Input({ required: true }) editMode: boolean;
    @Input({ required: true }) buildings: BuildingDTO[];

    showPreviewPlotImage: boolean = false;

    uploadQueue: UploadQueueItem[] = [];

    plotImages: PlotImageDTO[] = [];
    buildingImages: BuildingImageDTO[] = [];
    selectedFile: File | null = null;
    selectedPlotImage: PlotImageDTO | null = null;

    constructor(
        private plotImageDataservice: PlotImageDataservice,
        private buildingImageDataService: BuildingImageDataService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.getPlotImages();
        this.getBuildingImages();
    }

    getPlotImages() {
        this.plotImageDataservice
            .GetPlotImageByplot(this.plotDatabaseId)
            .subscribe((res) => {
                this.plotImages = res;
            });
    }
    getBuildingImages() {
        console.log('POT PHOTO BUIDLINGS', this.buildings);
        for (let building of this.buildings) {
            this.buildingImageDataService
                .GetBuildingImageByBuilding(building.id)
                .subscribe((res) => {
                    this.buildingImages = res;
                });
        }
    }

    getPlotImageUrl(item: PlotImageDTO) {
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
        formData.append('plotDatabaseId', this.plotDatabaseId.toString());
        fileUpload.clear();
        try {
            await this.plotImageDataservice
                .CreatePlotImage(formData)
                .toPromise();
            queueItem.status = 'Uploaded';

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `${file.name} uploaded successfully.`,
            });

            // Refresh the list of plot images
            this.getPlotImages();
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
                this.plotImageDataservice
                    .DeletePlotImage(item.id)
                    .subscribe((res) => {
                        if (res) {
                            this.messageService.add({
                                severity: 'info',
                                summary: 'Confirmed',
                                detail: 'Record deleted',
                            });
                            this.getPlotImages();
                        }
                    });
            },
        });
    }

    previewImage(image: PlotImageDTO) {
        this.showPreviewPlotImage = true;
        this.selectedPlotImage = image;
    }
}
