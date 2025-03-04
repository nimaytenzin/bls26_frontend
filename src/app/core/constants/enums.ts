export enum USERROLESENUM {
    'OWNER' = 'OWNER',
    'TENANT' = 'TENANT',
    'ADMIN' = 'ADMIN',
    'SUPERADMIN' = 'SUPERADMIN',
    'MANAGER' = 'MANAGER',
}

export enum LEASETYPE {
    'LAND' = 'LAND',
    'BUILDING' = 'BUILDING',
    'UNIT' = 'UNIT',
}

export enum LEASESTATUS {
    ACTIVE = 'ACTIVE', // Lease is currently active
    UPCOMING_EXPIRATION = 'UPCOMING_EXPIRATION', // Lease is nearing its end
    EXPIRED = 'EXPIRED', // Lease has expired or ended tenant moved out
    TERMINATED_BY_TENANT = 'TERMINATED_BY_TENANT', // Tenant terminated the lease
    TERMINATED_BY_OWNER = 'TERMINATED_BY_OWNER', // Owner terminated the lease
    PENDING = 'PENDING', // Lease agreement has been created but not yet active
    HOLDOVER = 'HOLDOVER', // Tenant is still occupying after expiration without a renewal
    CANCELLED = 'CANCELLED', // Lease was canceled before it became active
    SUSPENDED = 'SUSPENDED', // Lease temporarily paused (e.g., due to legal issues)
}
export enum LESSEETYPE {
    INDIVIDUAL = 'INDIVIDUAL',
    BUSINESS = 'BUSINESS',
    INSTITUTION = 'INSTITUTION',
}

export enum LESSORTYPE {
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
}

export enum LEASEUSES {
    RESIDENTIAL = 'RESIDENTIAL',
    COMMERCIAL = 'COMMERCIAL',
    HOTELSANDRESORTS = 'HOTELS_AND_RESORTS',
    PRIVATEOFFICE = 'PRIVATE_OFFICES',
    INSTUTIONAL = 'INSTITUTIONAL',
    RELIGIOUSSOCIALINSTITUTES = 'RELIGIOUS_SOCIAL_INSTITUTION',
}

export enum ADMINROLES {
    'ADMIN' = 'SYSADMIN',
    'FINANCE' = 'FINANCEADMIN',
}

export enum BUILDINGSTATUS {
    'ACTIVE' = 'ACTIVE',
    'INACTIVE' = 'INACTIVE',
}

export enum FLOORLEVELS {
    'BASEMENT 3' = '3B',
    'BASEMENT 2' = '2B',
    'BASEMENT 1' = 'B',
    'STILT' = 'S',
    'GROUND FLOOR' = 'G',
    '1st Floor' = '1',
}

export enum BuildingType {
    'CONTEMPORARY' = 'Contemporary',
    'Traditional' = 'Traditional',
}

export const UNITNUMBERS = [
    '01',
    '02',
    '03',
    '04',
    '05',
    '06',
    '07',
    '08',
    '09',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '23',
    '24',
    '25',
];

export enum UnitOccupancyStatus {
    'VACANT' = 'Vacant',

    'UNDER_MAINTENANCE' = 'Under Maintenance',
    'UNDER_CONSTRUCTION' = 'Under Construction',

    'OWNER_OCCUPIED' = 'Owner Occupied',
    'RENTED' = 'Rented',
    'SHORT_TERM_RENTAL' = 'Short Term Rental',
    'OTHERS' = 'Others',
}

export const NumberDropDownOptions = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
];
export const NumberDropDownOptionsAsString = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
].map((number) => number.toString());

export enum LocationTypes {
    'Rural' = 'R',
    'Urban' = 'U',
}
export enum AdministrativeZoneTypes {
    'Gewog' = 'Gewog',
    'Thromde' = 'Thromde',
}

export enum SubAdministrativeZoneTypes {
    'Chiwog' = 'Chiwog',
    'Locality' = 'Locality',
}

export enum LeaseAgreementSurchargeSource {
    BUILDING = 'Building',
    UNIT = 'Unit',
    ADDITIONAL = 'Additional',
}

export enum INVOICESTATUS {
    'Due' = 'DUE',
    'Paid' = 'PAID',
    'Remitted' = 'REMITTED',
}

export enum INVOICETRANSACTIONTYPES {
    'TENANTPAYMENT' = 'TENANTPAYMENT',
    'LANDLORDPAYMENT' = 'LANDLORDPAYMENT',
}

export enum INVOICETRANSACTIONMODES {
    'RMAPG' = 'RMAPG',
    'MBOB' = 'MBOB',
}
export enum BUILDINGOWNERSHIPTYPES {
    'SOLE' = 'SOLE',
    'JOINT' = 'JOINT',
}

export enum ENTRYDAMAGEACTIONSTATUS {
    REPORTED = 'REPORTED',
    RESOLVED = 'RESOLVED',
    REJECTED = 'REJECTED',
}

export enum LANDAREAUNITS {
    SQFT = 'sqFt',
    ACRE = 'Acre',
}

export enum PLOTCATEGORYENUM {
    OT = 'Old Thromde Thram',
    KA = 'Kasho',
    IN = 'Inheritance',
    ZH = 'Zhichhag',
    SA = 'Substitute',
    SL = 'Sale Purchase',
    EX = 'Exchange',
    GF = 'Gift',
    LE = 'Lease',
    SR = 'Soelra',
    AL = 'Allotment',
    NO = 'Normal',
    C = 'Commercial',
    R = 'Residential',
    I = 'Institutional',
    LUC = 'Land Use Certificate',
    UN = 'Unknown',
}

export enum PlotOwnershipENUM {
    CSO = 'Civil Society Organizations',
    CL = 'Community Land',
    CO = 'Corporations',
    CP = 'Crown Property',
    FO = 'Family Ownership',
    GD = 'Gerab Dratshang',
    GI = 'Government Institutions',
    I = 'Individual Ownership',
    JO = 'Joint Ownership',
    PC = 'Private Corporation',
    PLY = 'Pvt Lhakhang Yogey',
    RI = 'Religious Institutions',
    SL = 'State Land',
}

export enum LOCATIONFLAGENUM {
    R = 'Rural',
    U = 'Urban',
}

export enum ORGANIZATIONTYPES {
    BUSINESS = 'BUSINESS',
    INSTITUTION = 'INSTITUTION',
}

export enum ORGANIZATIONUSERTYPES {
    OWNER = 'OWNER',
    MANAGER = 'MANAGER',
}

export enum NOTIFICATIONTYPES {
    LEASE_CREATION = 'LEASE_CREATION',
    LEASE_SIGNING_REMINDER = 'LEASE_SIGNING_REMINDER',
    SECUTIRYDEPOSIT_PAYMENT_REMINDER = 'SECUTIRYDEPOSIT_PAYMENT_REMINDER',

    LEASE_RENEWAL = 'LEASE_RENEWAL',
    LEASE_TERMINATION = 'LEASE_TERMINATION',
    LEASE_ACTIVATED_NOTICE = 'LEASE_ACTIVATED_NOTICE',

    USER_CREATED = 'USER_CREATED',
    TEMPORARY_LOGINCODE = 'TEMPORARY_LOGINCODE',

    PAYMENT_ADVICE_GENERATION = 'PAYMENT_ADVICE_GENERATION',
    PAYMENT_ADVICE_REMINDER = 'PAYMENT_ADVICE_REMINDER',
    PAYMENT_RECEIPT_GENERATION = 'PAYMENT_RECEIPT_GENERATION',

    ENTRYDAMAGEREPORT_SUBMISSION_REMINDER = 'ENTRYDAMAGEREPORT_SUBMISSION_REMINDER',
    DAMAGEITEM_RESOLUTION = 'DAMAGEITEM_RESOLUTION',
}

export enum PAType {
    'SD' = 'Security_Deposit',
    'RECURRING' = 'RECURRING',
}

export enum PLOTAREAETYPES {
    ACRE = 'Acre',
    SQFT = 'Sqft',
}

export enum DamageType {
    'ENTRY_DAMAGE' = 'ENTRY_DAMAGE',
    'MAINTENANCE' = 'MAINTENANCE',
}
export enum DamageStatus {
    'OPEN' = 'OPEN',
    'RESOLVED' = 'RESOLVED',
    'ARCHIVED' = 'ARCHIVED',
}

export enum DAMAGERESOLVERTYPE {
    ADMIN = 'ADMIN',
    OWNER = 'OWNER',
    MANAGER = 'MANAGER',
    CURRENT_TENANT = 'CURRENT_TENANT',
    PREVIOUS_TENANT = 'PREVIOUS_TENANT',
}

export enum PAYMENTMODES {
    'ONLINE' = 'ONLINE',
    'CASH' = 'CASH',
    'BANK_TRANSFER' = 'BANKTRANSFER',
    'MBOB' = 'MBOB',
}

export enum AREAUNITS {
    'ACRE' = 'ACRE',
    'SQFT' = 'SQFT',
}

export enum LEASEATTACHMENTTYPES {
    'SIGNED_COPY' = 'SIGNED_COPY',
    'OTHERS' = 'OTHERS',
}
