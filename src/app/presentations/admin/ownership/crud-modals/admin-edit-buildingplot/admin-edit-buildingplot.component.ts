import { Component } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import {
    DialogService,
    DynamicDialogComponent,
    DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-admin-edit-buildingplot',
    standalone: true,
    imports: [ButtonModule, ReactiveFormsModule, InputTextModule],
    templateUrl: './admin-edit-buildingplot.component.html',
    styleUrl: './admin-edit-buildingplot.component.scss',
})
export class AdminEditBuildingplotComponent {
    instance: DynamicDialogComponent | undefined;
    buildingPlot: any;
    editBuildingPlotForm: FormGroup;
    constructor(
        private dialogService: DialogService,
        private ref: DynamicDialogRef,
        private fb: FormBuilder
    ) {
        this.instance = this.dialogService.getInstance(this.ref);

        if (this.instance && this.instance.data) {
            this.buildingPlot = this.instance.data;
            console.log(this.buildingPlot);
        }
        this.editBuildingPlotForm = this.fb.group({
            thramNumber: [this.buildingPlot.thramNumber, Validators.required],
            plotId: [this.buildingPlot.plotId, Validators.required],
        });
    }

    updateBuildingPlot() {}
    close() {
        this.ref.close();
    }
}
