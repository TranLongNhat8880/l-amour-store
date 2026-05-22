const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const UserModel = require('../user/user.model');
const pool = require('../../config/database');
const { hashPassword, comparePassword } = require('../../utils/hashPassword');
const sendEmail = require('../../utils/sendEmail');
require('dotenv').config();

// ─────────────────────────────────────────────
//  EMAIL TEMPLATE HELPERS (Rose & Stone Aesthetic)
// ─────────────────────────────────────────────

const parseUserAgent = (ua) => {
  if (!ua) return "Thiết bị không xác định";
  
  let browser = "Trình duyệt lạ";
  if (ua.includes("Edg/")) browser = "Microsoft Edge";
  else if (ua.includes("Chrome/")) browser = "Google Chrome";
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Firefox/")) browser = "Firefox";

  let os = "Thiết bị lạ";
  if (ua.includes("Windows NT")) os = "Windows";
  else if (ua.includes("Macintosh")) os = "MacBook/iMac";
  else if (ua.includes("iPhone")) os = "iPhone";
  else if (ua.includes("Android")) os = "Android";

  return `${browser} trên ${os}`;
};

const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>L'Amour Store</title>
</head>
<body style="margin:0; padding:0; background-color:#fff1f2; font-family:'serif', 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff1f2; padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:4px; overflow:hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- HEADER -->
          <tr>
            <td style="background-color:#9f1239; padding:40px; text-align:center;">
              <h1 style="margin:0; font-size:32px; letter-spacing:8px; color:#ffffff; font-weight:normal; text-transform:uppercase;">L'AMOUR</h1>
              <p style="margin:10px 0 0 0; font-size:10px; letter-spacing:4px; color:#fecdd3; text-transform:uppercase;">Tôn vinh vẻ đẹp phái nữ</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:48px 40px;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#fafaf9; padding:30px; text-align:center; border-top:1px solid #f3f4f6;">
              <p style="margin:0 0 10px 0; font-size:12px; color:#881337; font-weight:bold; letter-spacing:2px; text-transform:uppercase;">
                L'Amour Store
              </p>
              <p style="margin:0; font-size:11px; color:#78716c;">
                © 2026 L'Amour Lingerie. All rights reserved.<br/>
                Email này được gửi tự động, vui lòng không trả lời.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const otpBlock = (otpCode) => `
  <div style="text-align:center; margin:32px 0; padding:24px; background-color:#fff1f2; border:1px dashed #fda4af; border-radius:4px;">
    <p style="margin:0 0 8px 0; font-size:11px; letter-spacing:2px; color:#9f1239; text-transform:uppercase; font-weight:bold;">Mã xác thực của bạn</p>
    <div style="font-size:48px; font-weight:bold; letter-spacing:12px; color:#9f1239; margin:16px 0;">${otpCode}</div>
    <p style="margin:0; font-size:12px; color:#be123c;">Hiệu lực trong <strong>15 phút</strong></p>
  </div>
`;

// ─────────────────────────────────────────────
//  AUTH SERVICE
// ─────────────────────────────────────────────

const AuthService = {

  async register(userData) {
    const existingUser = await UserModel.findByEmail(userData.email);
    if (existingUser) {
      if (existingUser.is_active) {
        throw new Error('Email này đã được đăng ký và kích hoạt trên hệ thống.');
      }

      const hashedPassword = await hashPassword(userData.password);
      await UserModel.updatePassword(existingUser.id, hashedPassword);
      await UserModel.updateProfile(existingUser.id, {
        full_name: userData.full_name,
        phone: userData.phone,
        address: userData.address,
      });

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await UserModel.saveOtp(userData.email, otpCode, expiresAt);
      await this.sendWelcomeOtpEmail(userData.email, userData.full_name, otpCode);
      return existingUser.id;
    }

    const hashedPassword = await hashPassword(userData.password);
    const userId = await UserModel.create({ ...userData, password: hashedPassword, is_active: 0 });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await UserModel.saveOtp(userData.email, otpCode, expiresAt);
    await this.sendWelcomeOtpEmail(userData.email, userData.full_name, otpCode);

    return userId;
  },

  // ── Email 1: Xác thực tài khoản khi đăng ký ──────────────────────────
  async sendWelcomeOtpEmail(email, fullName, otpCode) {
    const body = emailWrapper(`
      <div style="text-align:center;">
        <p style="margin:0 0 12px 0; font-size:13px; letter-spacing:2px; color:#9f1239; text-transform:uppercase; font-weight:bold;">Xác Thực Tài Khoản</p>
        <h2 style="margin:0 0 24px 0; font-size:26px; color:#1c1917; font-weight:normal;">Chào mừng bạn, ${fullName}</h2>
        <p style="margin:0 0 16px 0; font-size:15px; line-height:1.8; color:#44403c;">
          Cảm ơn bạn đã lựa chọn L'Amour Store. Để hoàn tất quá trình đăng ký và bảo mật tài khoản, vui lòng sử dụng mã xác thực dưới đây:
        </p>

        ${otpBlock(otpCode)}

        <p style="margin:24px 0 0 0; font-size:13px; color:#78716c; line-height:1.6;">
          Mã xác thực này có hiệu lực trong vòng <strong>15 phút</strong>.<br/>
          Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.
        </p>
      </div>
    `);

    await sendEmail({
      email,
      subject: "Mã xác thực tài khoản — L'Amour Store",
      html: body,
    });
  },

  // ── Email 2: Kích hoạt thành công ─────────────────────────────────────
  async verifyRegister(email, otpCode) {
    const user = await UserModel.findByEmailWithOtp(email);
    if (!user) throw new Error('Email không tồn tại');
    if (user.is_active) throw new Error('Tài khoản đã được kích hoạt');

    if (!user.otp_code || user.otp_code !== otpCode) {
      throw new Error('Mã OTP không chính xác');
    }
    if (new Date(user.otp_expires_at) < new Date()) {
      throw new Error('Mã OTP đã hết hạn');
    }

    await pool.query(
      'UPDATE Users SET is_active = 1, otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
      [user.id]
    );

    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;

    const body = emailWrapper(`
      <div style="text-align:center;">
        <div style="font-size:40px; margin-bottom:20px;">🎉</div>
        <p style="margin:0 0 12px 0; font-size:13px; letter-spacing:2px; color:#9f1239; text-transform:uppercase; font-weight:bold;">Chúc mừng bạn</p>
        <h2 style="margin:0 0 24px 0; font-size:26px; color:#1c1917; font-weight:normal;">Tài khoản đã sẵn sàng!</h2>
        <p style="margin:0 0 32px 0; font-size:15px; line-height:1.8; color:#44403c;">
          Chào <strong>${user.full_name}</strong>, tài khoản của bạn đã được kích hoạt thành công. Đã đến lúc tận hưởng những đặc quyền mua sắm dành riêng cho thành viên.
        </p>
        <a href="${loginUrl}" style="display:inline-block; background-color:#9f1239; color:#ffffff; padding:16px 40px; font-size:14px; font-weight:bold; text-decoration:none; border-radius:4px; letter-spacing:1px; text-transform:uppercase;">
          Bắt đầu mua sắm ngay
        </a>
      </div>
    `);

    await sendEmail({
      email: user.email,
      subject: "Tài khoản đã kích hoạt thành công — L'Amour Store",
      html: body,
    });

    return true;
  },

  async login(email, password, userAgent = null, ipAddress = null, deviceToken = null) {
    const user = await UserModel.findByEmail(email);
    if (!user) throw new Error('Thông tin đăng nhập không chính xác.');
    if (!user.is_active) throw new Error('Tài khoản chưa được kích hoạt hoặc đã bị khóa.');

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) throw new Error('Thông tin đăng nhập không chính xác.');

    // --- NEW DEVICE VERIFICATION ---
    const fingerprint = Buffer.from(userAgent || 'unknown').toString('base64').substring(0, 50);
    
    let isTrusted = false;
    let currentDeviceToken = deviceToken;

    // 1. Kiểm tra bằng deviceToken trước
    if (currentDeviceToken) {
      const [devices] = await pool.query(
        'SELECT id FROM User_Devices WHERE user_id = ? AND device_token = ? AND is_trusted = TRUE AND trusted_until > NOW()',
        [user.id, currentDeviceToken]
      );
      if (devices.length > 0) isTrusted = true;
    }

    // 2. Fallback: Kiểm tra bằng fingerprint nếu chưa trust (Dự phòng cho trường hợp mất token ở client)
    if (!isTrusted) {
      const [devices] = await pool.query(
        'SELECT device_token FROM User_Devices WHERE user_id = ? AND fingerprint = ? AND is_trusted = TRUE AND trusted_until > NOW()',
        [user.id, fingerprint]
      );
      if (devices.length > 0) {
        isTrusted = true;
        currentDeviceToken = devices[0].device_token; // Lấy token cũ từ DB để dùng
      }
    }

    if (!isTrusted) {
      // Generate OTP for new device
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await UserModel.saveOtp(user.email, otpCode, expiresAt);
      
      // Send Email
      await this.sendDeviceOtpEmail(user.email, user.full_name, otpCode, userAgent, ipAddress);

      return { 
        status: 'REQUIRE_DEVICE_VERIFICATION', 
        message: 'Chúng tôi phát hiện đăng nhập từ thiết bị lạ. Vui lòng xác thực mã OTP gửi tới email của bạn.',
        email: user.email 
      };
    }

    // --- SESSION MANAGEMENT ---
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await pool.query(
      'INSERT INTO User_Sessions (id, user_id, user_agent, ip_address, expires_at, device_token) VALUES (?, ?, ?, ?, ?, ?)',
      [sessionId, user.id, userAgent, ipAddress, expiresAt, currentDeviceToken]
    );

    const payload = { 
      user: { 
        id: user.id, 
        role: user.role, 
        email: user.email,
        sessionId: sessionId 
      } 
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    const { password: _, otp_code, otp_expires_at, ...userData } = user;
    return { token, user: { ...userData, sessionId }, deviceToken: currentDeviceToken };
  },

  // ── Email 3: Quên mật khẩu ────────────────────────────────────────────
  async forgotPassword(email) {
    const user = await UserModel.findByEmail(email);
    if (!user) return true;

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await UserModel.saveOtp(email, otpCode, expiresAt);

    const body = emailWrapper(`
      <div style="text-align:center;">
        <p style="margin:0 0 12px 0; font-size:13px; letter-spacing:2px; color:#9f1239; text-transform:uppercase; font-weight:bold;">Đặt Lại Mật Khẩu</p>
        <h2 style="margin:0 0 24px 0; font-size:26px; color:#1c1917; font-weight:normal;">Xin chào, ${user.full_name}</h2>
        <p style="margin:0 0 16px 0; font-size:15px; line-height:1.8; color:#44403c;">
          Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã xác thực dưới đây để thiết lập mật khẩu mới:
        </p>

        ${otpBlock(otpCode)}

        <p style="margin:24px 0 0 0; font-size:13px; color:#78716c; line-height:1.6;">
          Vì lý do bảo mật, mã này chỉ có hiệu lực trong <strong>15 phút</strong>.<br/>
          Nếu bạn không yêu cầu đổi mật khẩu, hãy bỏ qua email này.
        </p>
      </div>
    `);

    await sendEmail({
      email: user.email,
      subject: "Yêu cầu đặt lại mật khẩu — L'Amour Store",
      html: body,
    });

    return true;
  },

  async resetPassword(email, otpCode, newPassword) {
    const user = await UserModel.findByEmailWithOtp(email);
    if (!user) throw new Error('Email không tồn tại');

    if (!user.otp_code || user.otp_code !== otpCode) {
      throw new Error('Mã OTP không hợp lệ');
    }
    if (new Date(user.otp_expires_at) < new Date()) {
      await UserModel.clearOtp(user.id);
      throw new Error('Mã OTP đã hết hạn. Vui lòng yêu cầu lại.');
    }
    if (newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    const hashed = await hashPassword(newPassword);
    await UserModel.updatePassword(user.id, hashed);
    await UserModel.clearOtp(user.id);

    return true;
  },

  async sendDeviceOtpEmail(email, fullName, otpCode, userAgent, ipAddress) {
    const displayDevice = parseUserAgent(userAgent);
    const displayIp = ipAddress === '::1' || ipAddress === '127.0.0.1' ? 'Localhost (Máy chủ)' : ipAddress;

    const body = emailWrapper(`
      <div style="text-align:center;">
        <p style="margin:0 0 12px 0; font-size:13px; letter-spacing:2px; color:#9f1239; text-transform:uppercase; font-weight:bold;">Cảnh Báo Bảo Mật</p>
        <h2 style="margin:0 0 24px 0; font-size:26px; color:#1c1917; font-weight:normal;">Chào ${fullName},</h2>
        <p style="margin:0 0 16px 0; font-size:15px; line-height:1.8; color:#44403c;">
          Phát hiện yêu cầu đăng nhập từ thiết bị mới:
        </p>
        
        <div style="display:inline-block; text-align:left; background:#f9fafb; padding:20px; border-left:4px solid #9f1239; border-radius:4px; margin-bottom:25px; min-width:250px;">
          <p style="margin:0 0 8px 0; font-size:14px; color:#1c1917;"><strong>📍 Thiết bị:</strong> ${displayDevice}</p>
          <p style="margin:0; font-size:14px; color:#1c1917;"><strong>🌐 Địa chỉ IP:</strong> ${displayIp}</p>
        </div>

        <p style="margin:0 0 16px 0; font-size:15px; line-height:1.8; color:#44403c;">
          Đây là mã xác thực (OTP) của bạn:
        </p>

        ${otpBlock(otpCode)}

        <p style="margin:24px 0 0 0; font-size:13px; color:#78716c; line-height:1.6;">
          Mã này có hiệu lực trong <strong>10 phút</strong>.<br/>
          Nếu không phải bạn, hãy <strong>đổi mật khẩu</strong> để bảo vệ tài khoản.
        </p>
      </div>
    `);

    await sendEmail({
      email,
      subject: "Mã xác thực đăng nhập thiết bị mới — L'Amour Store",
      html: body,
    });
  },

  async verifyDeviceOTP(email, otpCode, userAgent, ipAddress, trustDevice = true) {
    const user = await UserModel.findByEmailWithOtp(email);
    if (!user) throw new Error('Người dùng không tồn tại');

    if (!user.otp_code || user.otp_code !== otpCode) {
        throw new Error('Mã OTP không chính xác');
    }
    if (new Date(user.otp_expires_at) < new Date()) {
        throw new Error('Mã OTP đã hết hạn');
    }

    // Clear OTP
    await UserModel.clearOtp(user.id);

    let deviceToken = null;
    const fingerprint = Buffer.from(userAgent || 'unknown').toString('base64').substring(0, 50);

    if (trustDevice) {
        deviceToken = uuidv4();
        const deviceId = uuidv4();
        const trustedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await pool.query(
            `INSERT INTO User_Devices (id, user_id, device_name, fingerprint, device_token, ip_address, is_trusted, trusted_at, trusted_until) 
             VALUES (?, ?, ?, ?, ?, ?, TRUE, NOW(), ?)
             ON DUPLICATE KEY UPDATE 
                device_token = VALUES(device_token),
                ip_address = VALUES(ip_address), 
                is_trusted = TRUE, 
                trusted_at = NOW(), 
                trusted_until = VALUES(trusted_until)`,
            [deviceId, user.id, userAgent, fingerprint, deviceToken, ipAddress, trustedUntil]
        );
    }

    // Now proceed to login and create a session
    const sessionId = uuidv4();
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
        'INSERT INTO User_Sessions (id, user_id, user_agent, ip_address, expires_at, device_token) VALUES (?, ?, ?, ?, ?, ?)',
        [sessionId, user.id, userAgent, ipAddress, sessionExpiresAt, deviceToken]
    );

    const payload = { 
        user: { 
            id: user.id, 
            role: user.role, 
            email: user.email,
            sessionId: sessionId 
        } 
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    const { password: _, otp_code, otp_expires_at, ...userData } = user;
    return { token, user: { ...userData, sessionId }, deviceToken };
  },

  async logout(sessionId, userId) {
    await pool.query(
        'UPDATE User_Sessions SET is_revoked = TRUE WHERE id = ? AND user_id = ?',
        [sessionId, userId]
    );
    return true;
  }
};

module.exports = AuthService;
