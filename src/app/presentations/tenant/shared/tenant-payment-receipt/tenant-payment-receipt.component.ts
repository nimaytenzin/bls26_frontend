import { Component, OnInit } from '@angular/core';
import { DividerModule } from 'primeng/divider';
import { ZHIDHAYCONTACTDETAILS } from 'src/app/core/constants/constants';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import html2canvas from 'html2canvas';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-tenant-payment-receipt',
    templateUrl: './tenant-payment-receipt.component.html',
    styleUrls: ['./tenant-payment-receipt.component.scss'],
    standalone: true,
    imports: [DividerModule, ButtonModule],
})
export class TenantPaymentReceiptComponent implements OnInit {
    paymentAdvice: PaymentAdviceDto;
    zhidhayContactDetails = ZHIDHAYCONTACTDETAILS;
    constructor(private paymentAdviceDataService: PaymentAdviceDataService) {
        this.paymentAdviceDataService.FindOne(1).subscribe((res) => {
            this.paymentAdvice = res;
        });
    }

    ngOnInit() {}

    screenshot() {
        // Select the element that you want to capture
        const captureElement = document.querySelector('#capture');

        const name = this.paymentAdvice.title + '.png';
        // Call the html2canvas function and pass the element as an argument
        html2canvas(captureElement as HTMLElement).then((canvas) => {
            // Get the image data as a base64-encoded string
            const imageData = canvas.toDataURL('image/png');

            // Do something with the image data, such as saving it as a file or sending it to a server
            // For example, you can create an anchor element and trigger a download action
            const link = document.createElement('a');
            link.setAttribute('download', name);
            link.setAttribute('href', imageData);
            link.click();
        });
    }
}
