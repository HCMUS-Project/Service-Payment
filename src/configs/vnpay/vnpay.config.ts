/**
 * Configuration for VNPAY with environment dev
 */

export default () => ({
    tmnCode: process.env.TMN_CODE || '',
    secureSecret: process.env.SECURE_SECRET || '',
    vnpayHost: process.env.VNPAY_HOST || 'https://sandbox.vnpayment.vn',
    vnpayReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay/callback',
    vnpayIpAddr: process.env.VNPAY_IP_ADDR || '',
});
