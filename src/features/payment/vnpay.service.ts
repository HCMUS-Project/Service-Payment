import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VNPay, VNPayConfig } from 'src/util/vnpay/src';
import { ExternalTenantService } from '../external_services/tenant_service/tenant.service';
import Logger, { LoggerKey } from 'src/core/logger/interfaces/logger.interface';

const CONVERT_AMOUNT = 1000000;

@Injectable()
export class VnPayFactoryService {
    constructor(
        private readonly configService: ConfigService,
        private readonly tenantService: ExternalTenantService,
        @Inject(LoggerKey) private logger: Logger,
    ) {}

    async createVnpayService(domain: string = null): Promise<VNPay> {
        const config = await this.getVnpayConfig(domain);

        return new VNPay({ ...config });
    }

    private async getVnpayConfig(domain: string = null): Promise<VNPayConfig | null> {
        let vnpayConfig: VNPayConfig = {
            tmnCode: this.configService.get('tmnCode'),
            secureSecret: this.configService.get('secureSecret'),
            vnpayHost: this.configService.get('vnpayHost'),
        };

        if (this.configService.get('env') !== 'dev' || domain) {
            console.log('get vnpay config from tenant service');
            try {
                const data = await this.tenantService.getVNPayConfigByTenantId({ domain });
                vnpayConfig.tmnCode = data.vnpayConfig.tmnCode;
                vnpayConfig.secureSecret = data.vnpayConfig.secureSecret;
            } catch (error) {
                this.logger.error('error get vnpay config from tenant service', error);
            }
        } else {
        }

        return vnpayConfig;
    }

    generateBillId(): string {
        const billNumber = Math.floor(Math.random() * CONVERT_AMOUNT);
        const createDate = new Date();
        return `${billNumber}-${createDate.getTime()}`;
    }
}
