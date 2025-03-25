// student.service.ts
import { Injectable } from '@angular/core';
import { Student } from './student.dto';

@Injectable({ providedIn: 'root' })
export class StudentService {
    private students: Student[] = [
        {
            id: '1',
            studentCode: '202.223.1231.22',
            fullName: 'Sonam Dechen Tshogyal',
            preferredName: 'Tsho Tsho',
            dob: new Date('2021-01-22'),
            parentName: 'Pema Yangzom',
            contactNumber: '17263764',
            alternateContact: '77267691',
            registrationDate: new Date(),
            medicalConditions: ['Asthma'],
            cid: '103020002312',
            notes: 'Loves outdoor activities',
            specialInstructions: 'Avoid exposure to cold temperatures',
        },
    ];

    getAllStudents(): Student[] {
        return this.students;
    }

    saveStudent(student: Student): void {
        const index = this.students.findIndex((s) => s.id === student.id);
        if (index > -1) {
            this.students[index] = student;
        } else {
            this.students.push({ ...student, id: this.generateId() });
        }
    }

    deleteStudent(id: string): void {
        this.students = this.students.filter((s) => s.id !== id);
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}
