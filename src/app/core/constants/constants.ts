//export const API_URL = 'http://localhost:3002';
export const API_URL = 'https://www.zhidhay.com/api';
export const CHAT_APIURL = 'https://chat.zhidhay.com';
export const COMPANY_NAME = 'zhidhay.com';
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
    webAppName: 'www.zhidhay.com',
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
