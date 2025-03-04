export class SendNotificationDTO {
    paymentAdviseId?: number | null = null;
    paymentReceiptId?: number | null = null;
    leaseAgreementId?: number | null = null;
    fromUserId: number;
    toUserId: number;
    damageItemId?: number;
    notificationType: string;
}

export class BroadcastNotificationToAllUnderAdminDTO {
    adminId: number;
    message: string;
}

export class BroadcastNotificationToAPlotUnderAdminDTO {
    plotId: number;
    message: string;
}

export interface NotificationTypeDTO {
    id: number;
    name: string;
    description: string;
}
export interface NotificationDTO {
    id: number;
    notificationTypeId: number;
    fromUserId: number;
    toUserId: number;
    message: string;

    paymentAdviseId: number;
    paymentReceiptId: number;
    leaseAgreementId: number;
    damageItemId: number;

    notificationType: NotificationTypeDTO;
}

export enum NotificationChannelStatusEnum {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
}

export interface NotificationChannelStatusDTO {
    status: NotificationChannelStatusEnum;
    message: string;
}

export interface NotificationResponseDTO {
    SMS: NotificationChannelStatusDTO | null;
    PUSH: NotificationChannelStatusDTO | null;
    EMAIL: NotificationChannelStatusDTO | null;
}
