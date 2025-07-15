import {
	Component,
	Input,
	Output,
	EventEmitter,
	OnChanges,
	SimpleChanges,
	OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Hall } from '../../../../../core/dataservice/hall/hall.interface';
import { Seat } from '../../../../../core/dataservice/seat/seat.interface';
import {
	Screening,
	ScreeningSeatPrice,
} from '../../../../../core/dataservice/screening/screening.interface';
import { ScreeningDataService } from '../../../../../core/dataservice/screening/screening.dataservice';
import { SeatDataService } from '../../../../../core/dataservice/seat/seat.dataservice';
import { BookingDataService } from '../../../../../core/dataservice/booking/booking.dataservice';
import {
	Booking,
	BookingStatusEnum,
	SessionSeatOccupancyResponse,
	SeatSelectionDto,
	SeatSelectionResponse,
} from '../../../../../core/dataservice/booking/booking.interface';

interface SelectedSeat extends Seat {
	price: number;
	selected: boolean;
	status: 'available' | 'booked' | 'selected';
}

@Component({
	selector: 'app-admin-seat-selection',
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
	templateUrl: './admin-seat-selection.component.html',
	styleUrls: ['./admin-seat-selection.component.scss'],
	providers: [MessageService],
})
export class AdminSeatSelectionComponent {}
