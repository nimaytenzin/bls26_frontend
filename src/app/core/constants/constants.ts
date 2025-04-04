export const API_URL = 'http://localhost:3000';
export const BASE_URL = 'http://localhost:3000';
export const COMPANY_NAME = 'LittleSteps';
export const ZHICHAR_API_URL = 'https://zhichar.bt/dev';
//export const GEOMETRYSERVERURL = 'http://localhost:3000';
export const GEOMETRYSERVERURL = 'https://www.zhidhay.com/geom-api';

interface IZhidhayContactDetails {
    name: string;
    phoneNumber: number;
    email: string;
    address: string;
    webAppName: string;
}

export const ZHIDHAYCONTACTDETAILS: IZhidhayContactDetails = {
    name: '',
    webAppName: 'Chey Chey Jabchor',
    phoneNumber: 17263764,
    email: 'info@zhidhay.com',
    address: 'Babesa, Thim Throm',
};

export interface PageEvent {
    first: number;
    rows: number;
    page: number;
    pageCount: number;
}

export const ROWSPERPAGEOPTION = [10, 20, 30, 50];
