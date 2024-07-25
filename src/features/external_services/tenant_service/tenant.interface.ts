import { Observable } from 'rxjs';
import {
    GetVNPayConfigByDomainRequest,
    VNPayConfig,
    VNPayConfigResponse,
} from 'src/proto_build/external/tenant_pb';

export interface TenantServiceInterface {
    GetVNPayConfigByTenantId(data: IGetVNPayConfigRequest): Observable<IGetVNPayConfigResponse>;
}

export interface IVNPayConfig extends VNPayConfig.AsObject {}

export interface IGetVNPayConfigRequest extends GetVNPayConfigByDomainRequest.AsObject {}
export interface IGetVNPayConfigResponse extends VNPayConfigResponse.AsObject {}
