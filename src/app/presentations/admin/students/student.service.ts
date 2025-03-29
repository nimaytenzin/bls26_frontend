// student.service.ts
import { Injectable } from '@angular/core';
import { Child } from './child.dto';
import { API_URL } from 'src/app/core/constants/constants';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StudentService {
    private apiUrl = API_URL
    // private students: Student[] = [
    //     {
    //         id: '1',
    //         studentCode: '202.223.1231.22',
    //         fullName: 'Sonam Dechen Tshogyal',
    //         preferredName: 'Tsho Tsho',
    //         dob: new Date('2021-01-22'),
    //         parentName: 'Pema Yangzom',
    //         contactNumber: '17263764',
    //         alternateContact: '77267691',
    //         registrationDate: new Date(),
    //         medicalConditions: ['Asthma'],
    //         cid: '103020002312',
    //         notes: 'Loves outdoor activities',
    //         specialInstructions: 'Avoid exposure to cold temperatures',
    //     },
    // ];
    constructor(private http: HttpClient) { }

    getChildByFacility(facilityId: number): Observable<Child[]> {
        return this.http.get<Child[]>(`${this.apiUrl}/child/facility/${facilityId}`);

    }


}
