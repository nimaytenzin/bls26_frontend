import { PAType, PAYMENTMODES } from 'src/app/core/constants/enums';
import { UnitDTO } from '../units/unit.dto';
import { TenantDTO } from '../users/tenant.dto';
import { LeaseAgreeementDTO } from 'src/app/core/dataservice/lease/lease-agreement.dto';
import { PaymentAdviceDto } from './payment-advice.dto';
import { UserDTO } from '../../dataservice/users-and-auth/dto/user.dto';

export interface PaymentReceiptDTO {
    id: number;
    amount: number;
    refNo: string;

    paymentMode: PAYMENTMODES;
    txnDate: string;
    isVerified: boolean;

    receivedBy?: number;
    receiver?: UserDTO;

    remarks: string;

    paymentAdvises: PaymentAdviceDto[];
}
