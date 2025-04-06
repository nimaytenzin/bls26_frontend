import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { DialogModule } from 'primeng/dialog';
import { MasonryGridItemDirective } from './masonry.directive';

@Component({
    selector: 'app-admin-student-report-card',
    standalone: true,
    imports: [
        CommonModule,
        ChartModule,
        DialogModule,
        MasonryGridItemDirective,
    ],
    templateUrl: './admin-student-report-card.component.html',
    styleUrls: ['./admin-student-report-card.component.css'],
})
export class AdminStudentReportCardComponent implements OnInit {
    attendanceData: any;
    moodData: any;
    bmiData: any;
    chartOptions: any;

    sonamPhotos = [
        'https://images.unsplash.com/photo-1588072432836-e10032774350?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Classroom activity
        'https://images.unsplash.com/photo-1588072432836-e10032774350?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Classroom activity
        'https://images.unsplash.com/photo-1527631746610-bca00a040d60?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Art class
        'https://images.unsplash.com/photo-1527631746610-bca00a040d60?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Art class
        'https://images.unsplash.com/photo-1541692641319-981cc79ee10a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Group activity
    ];

    photoCaptions = [
        'Tashi in traditional Bhutanese gho',
        'Learning Bhutanese alphabet',
        'Playing in the school courtyard',
        'Story time with Madam Dechen',
        'Creating traditional Bhutanese art',
        'Celebrating Bhutanese festival',
    ];
    displayLightbox = false;
    selectedPhoto = '';
    lightboxCaption = '';
    currentPhotoIndex = 0;

    ngOnInit(): void {
        this.chartOptions = {
            // responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#4B5563',
                    },
                },
            },
            scales: {
                x: { ticks: { color: '#6B7280' }, grid: { color: '#E5E7EB' } },
                y: { ticks: { color: '#6B7280' }, grid: { color: '#E5E7EB' } },
            },
        };

        this.attendanceData = {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [
                {
                    label: 'Attendance (%)',
                    data: [100, 95, 98, 100],
                    fill: false,
                    borderColor: '#60A5FA',
                    tension: 0.4,
                },
            ],
        };

        this.moodData = {
            labels: ['Happy 😊', 'Calm 😌', 'Playful 😄', 'Tired 😴'],
            datasets: [
                {
                    data: [40, 25, 20, 15],
                    backgroundColor: [
                        '#34D399',
                        '#FBBF24',
                        '#60A5FA',
                        '#F87171',
                    ],
                },
            ],
        };

        this.bmiData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr'],
            datasets: [
                {
                    label: 'BMI',
                    data: [15.8, 16.1, 16.2, 16.5],
                    fill: true,
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    borderColor: '#8B5CF6',
                    tension: 0.4,
                },
            ],
        };
    }

    getPhotoCaption(index: number): string {
        return this.photoCaptions[index] || 'School activity';
    }

    showFullImage(photo: string) {
        this.selectedPhoto = photo;
        this.currentPhotoIndex = this.sonamPhotos.indexOf(photo);
        this.lightboxCaption = this.getPhotoCaption(this.currentPhotoIndex);
        this.displayLightbox = true;
    }

    navigatePhoto(direction: number) {
        this.currentPhotoIndex =
            (this.currentPhotoIndex + direction + this.sonamPhotos.length) %
            this.sonamPhotos.length;
        this.selectedPhoto = this.sonamPhotos[this.currentPhotoIndex];
        this.lightboxCaption = this.getPhotoCaption(this.currentPhotoIndex);
    }
}
