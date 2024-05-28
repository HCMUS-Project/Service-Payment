import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VNPay, VNPayConfig } from 'src/util/vnpay/src';

@Injectable()
export class VnPayFactoryService {
    constructor(private readonly configService: ConfigService) {}

    createVnpayService(domain: string = null): VNPay {
        const config = this.getVnpayConfig(domain);

        return new VNPay({ ...config });
    }

    private getVnpayConfig(domain: string = null): VNPayConfig | null {
        let vnpayConfig: VNPayConfig = null;
        if (this.configService.get('env') === 'dev') {
            vnpayConfig = {
                tmnCode: this.configService.get('tmnCode'),
                secureSecret: this.configService.get('secureSecret'),
                vnpayHost: this.configService.get('vnpayHost'),
            };
        } else {
            // TODO: call api get vnpay config with domain
        }
        return vnpayConfig;
    }

    generateBillId(): string {
        const billNumber = Math.floor(Math.random() * 1000000);
        const createDate = new Date();
        return `${billNumber}-${createDate.getTime()}`;
    }
}
