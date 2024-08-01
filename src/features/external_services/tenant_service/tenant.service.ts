import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { IGetVNPayConfigRequest, TenantServiceInterface } from './tenant.interface';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ExternalTenantService {
    private tenantService: TenantServiceInterface;

    constructor(@Inject('GRPC_TENANT_SERVICE') private readonly client: ClientGrpc) {}

    onModuleInit() {
        this.tenantService = this.client.getService<TenantServiceInterface>('VNPayConfigService');
    }

    async getVNPayConfigByTenantId(data: IGetVNPayConfigRequest) {
        try {
            return await firstValueFrom(this.tenantService.GetVNPayConfigByTenantId(data));
        } catch (error) {
            throw error;
        }
    }
}
