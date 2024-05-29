export interface DataFilter {
    endDate?: string;
    startDate?: string;
    minAmount?: number;
    maxAmount?: number;
    orderId?: string;
    status?: string;
    paymentMethodId?: string;
    domain: string;
    user?: string;
}
