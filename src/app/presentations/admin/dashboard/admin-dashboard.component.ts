import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { BuildingDataService } from 'src/app/core/dataservice/building/building.dataservice';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { StatsDataService } from 'src/app/core/dataservice/statistics/statistics.dataservice';
import { AdminSummaryStatisticsDTO } from 'src/app/core/dataservice/statistics/statistics.dto';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import {
    PaymentAdviceDto,
    PaymentAdviceSummaryDTO,
} from 'src/app/core/dto/payments/payment-advice.dto';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { PARSEBUILDINGFLOORS } from 'src/app/core/utility/helper.function';

import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { GalleriaModule } from 'primeng/galleria';
import { MeterGroupModule } from 'primeng/metergroup';
import { TabViewModule } from 'primeng/tabview';
import { AdminDashboardBroadcastSmsComponent } from './components/admin-dashboard-broadcast-sms/admin-dashboard-broadcast-sms.component';
import { AuthenticatedUserDTO } from 'src/app/core/dataservice/users-and-auth/dto/auth.dto';
import { AdminDashboardLeaseActionSummaryComponent } from './components/admin-dashboard-lease-action-summary/admin-dashboard-lease-action-summary.component';
import { Router } from '@angular/router';
import { ToWords } from 'to-words';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { AvatarModule } from 'primeng/avatar';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-admin-dashboard',
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        ButtonModule,
        GalleriaModule,
        MeterGroupModule,
        DividerModule,
        TabViewModule,
        ProgressBarModule,
        TooltipModule,
        TagModule,
        ConfirmDialogModule,
        ChartModule,
        DropdownModule,
        FormsModule,
        AvatarModule,
        ToastModule,
        InputTextModule,
    ],
    providers: [MessageService, ConfirmationService, DialogService],
})
export class AdminDashboardComponent {
    today = new Date();
    presentToday = 23;
    facilitators = 5;
    birthdays = 2;
    healthAlerts = 1;
    weather = {
        temp: 18,
        condition: 'Mostly Sunny',
        icon: '🌤️',
    };

    // Messages with read status
    messages = [
        {
            id: 1,
            from: "Kinley's Parent",
            content: 'Will Kinley need extra clothes tomorrow?',
            read: false,
            time: '10:30 AM',
        },
        {
            id: 2,
            from: 'System',
            content: 'Tuition reminder sent to 3 parents',
            read: true,
            time: '9:15 AM',
        },
        {
            id: 3,
            from: 'Pema (Teacher)',
            content: 'Field trip permission slips due Friday',
            read: false,
            time: 'Yesterday',
        },
    ];

    // Events with dates
    events = [
        {
            id: 1,
            title: 'Storytelling Day',
            date: new Date(2023, 3, 10),
            type: 'event',
        },
        {
            id: 2,
            title: 'Art Exhibition',
            date: new Date(2023, 3, 15),
            type: 'event',
        },
        {
            id: 3,
            title: 'Parent-Teacher Meetings',
            date: new Date(2023, 3, 20),
            type: 'meeting',
        },
    ];

    // Activity feed with types
    activityFeed = [
        {
            id: 1,
            type: 'birthday',
            content: 'Yeshi celebrated their 4th birthday today',
            child: 'Yeshi',
            time: '2 hours ago',
        },
        {
            id: 2,
            type: 'photo',
            content: 'New photo posted in Class A Gallery',
            class: 'Class A',
            time: '4 hours ago',
        },
        {
            id: 3,
            type: 'attendance',
            content: 'Attendance submitted by Pema',
            teacher: 'Pema',
            class: 'Class B',
            time: 'Yesterday',
        },
        {
            id: 4,
            type: 'health',
            content: 'Health check completed for 12 children',
            time: 'Yesterday',
        },
    ];

    // Enrollment chart data with animation
    enrollmentChartData = {
        labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
        datasets: [
            {
                label: 'Children Enrolled',
                data: [28, 30, 29, 32, 34, 36],
                fill: true,
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: '#6366F1',
                tension: 0.4,
                pointBackgroundColor: '#6366F1',
                pointBorderColor: '#fff',
                pointHoverRadius: 5,
            },
        ],
    };

    // Attendance by class
    attendanceByClass = [
        { class: 'Toddlers', present: 8, total: 10, color: '#10B981' },
        { class: 'Pre-K', present: 7, total: 9, color: '#3B82F6' },
        { class: 'Kindergarten', present: 8, total: 10, color: '#F59E0B' },
    ];

    chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context: any) =>
                        `${context.dataset.label}: ${context.raw}`,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 5,
                },
            },
        },
        animation: {
            duration: 1000,
            easing: 'easeInOutQuad',
        },
    };

    // Weather locations for dropdown
    weatherLocations = [
        { name: 'School Location', temp: 18, condition: 'Mostly Sunny' },
        { name: 'Main City', temp: 20, condition: 'Partly Cloudy' },
    ];
    selectedLocation = this.weatherLocations[0];

    // New message input
    newMessage = '';

    constructor(
        private dialogService: DialogService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        // Simulate loading data
        setTimeout(() => {
            this.presentToday = 24;
            this.messageService.add({
                severity: 'success',
                summary: 'Update',
                detail: 'New attendance record received',
            });
        }, 1500);
    }

    enrollChild() {}

    postAnnouncement() {}

    recordAttendance() {}

    markAsRead(message: any) {
        message.read = true;
    }

    deleteMessage(message: any) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this message?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.messages = this.messages.filter(
                    (m) => m.id !== message.id
                );
                this.messageService.add({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: 'Message deleted',
                });
            },
        });
    }

    sendMessage() {
        if (this.newMessage.trim()) {
            this.messages.unshift({
                id: this.messages.length + 1,
                from: 'You',
                content: this.newMessage,
                read: true,
                time: 'Just now',
            });
            this.newMessage = '';
            this.messageService.add({
                severity: 'success',
                summary: 'Sent',
                detail: 'Message sent',
            });
        }
    }

    changeLocation(location: any) {
        this.selectedLocation = location;
        this.weather = {
            temp: location.temp,
            condition: location.condition,
            icon: location.temp > 20 ? '☀️' : location.temp > 15 ? '🌤️' : '⛅',
        };
    }

    get unreadMessagesCount(): number {
        return this.messages.filter((m) => !m.read).length;
    }

    getEventIcon(event: any) {
        return event.type === 'meeting' ? '👥' : '🎉';
    }

    getActivityIcon(activity: any) {
        switch (activity.type) {
            case 'birthday':
                return '🎂';
            case 'photo':
                return '📷';
            case 'attendance':
                return '📝';
            case 'health':
                return '❤️';
            default:
                return 'ℹ️';
        }
    }

    getDaysUntil(date: Date): string {
        const diff = date.getTime() - this.today.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days === 0
            ? 'Today'
            : days === 1
            ? 'Tomorrow'
            : `In ${days} days`;
    }
}
