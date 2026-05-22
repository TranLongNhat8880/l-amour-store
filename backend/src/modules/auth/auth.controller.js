const AuthService = require('./auth.service');
const { success } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const AuthController = {
    register: asyncHandler(async (req, res) => {
        const { email, password, full_name, phone, address } = req.body;
        await AuthService.register({ email, password, full_name, phone, address, role: 'user' });
        return success(res, 'Mã OTP đã được gửi đến email của bạn', null, 201);
    }),

    verifyRegister: asyncHandler(async (req, res) => {
        const { email, otp_code } = req.body;
        await AuthService.verifyRegister(email, otp_code);
        return success(res, 'Kích hoạt tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.');
    }),

    login: asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.headers['x-forwarded-for'];
        const deviceToken = req.headers['x-device-token'];

        const data = await AuthService.login(email, password, userAgent, ipAddress, deviceToken);
        
        if (data.status === 'REQUIRE_DEVICE_VERIFICATION') {
            return success(res, data.message, { status: data.status, email: data.email });
        }

        return success(res, 'Đăng nhập thành công', data);
    }),

    verifyDeviceOTP: asyncHandler(async (req, res) => {
        const { email, otp_code, trustDevice } = req.body;
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.headers['x-forwarded-for'];

        const data = await AuthService.verifyDeviceOTP(email, otp_code, userAgent, ipAddress, trustDevice);
        return success(res, 'Xác thực thiết bị thành công', data);
    }),

    logout: asyncHandler(async (req, res) => {
        await AuthService.logout(req.user.sessionId, req.user.id);
        return success(res, 'Đăng xuất thành công');
    }),

    getProfile: asyncHandler(async (req, res) => {
        return success(res, 'Profile retrieved', req.user);
    }),

    // ===== FORGOT PASSWORD: Gửi OTP =====
    forgotPassword: asyncHandler(async (req, res) => {
        const { email } = req.body;
        await AuthService.forgotPassword(email);
        // Luôn trả về thông báo thành công (không tiết lộ email có tồn tại không)
        return success(res, 'Nếu email tồn tại trong hệ thống, mã OTP đã được gửi đến hộp thư của bạn.');
    }),

    // ===== RESET PASSWORD: Xác nhận OTP và đặt mật khẩu mới =====
    resetPassword: asyncHandler(async (req, res) => {
        const { email, otp_code, new_password } = req.body;
        await AuthService.resetPassword(email, otp_code, new_password);
        return success(res, 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.');
    })
};

module.exports = AuthController;
