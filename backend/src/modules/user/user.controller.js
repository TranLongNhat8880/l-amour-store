const UserService = require('./user.service');
const { success, error } = require('../../utils/response');

const UserController = {
    // ===================== PROFILE =====================
    async getProfile(req, res) {
        try {
            const profile = await UserService.getProfile(req.user.id);
            return success(res, 'Profile retrieved', profile);
        } catch (err) {
            return error(res, err.message, 404);
        }
    },

    async updateProfile(req, res) {
        try {
            const { full_name, phone, address } = req.body;
            if (!full_name) return error(res, 'full_name không được để trống', 400);

            // avatar_url nếu có upload file
            let avatar_url = req.file ? req.file.path : null;

            // Nếu không upload file mới, giữ avatar cũ
            if (!avatar_url) {
                const currentProfile = await UserService.getProfile(req.user.id);
                avatar_url = currentProfile.avatar_url;
            }

            const updated = await UserService.updateProfile(req.user.id, {
                full_name, phone, address, avatar_url
            });
            return success(res, 'Profile updated successfully', updated);
        } catch (err) {
            return error(res, err.message, 500);
        }
    },

    async changePassword(req, res) {
        try {
            const { current_password, new_password } = req.body;
            if (!current_password || !new_password) {
                return error(res, 'Cần cung cấp current_password và new_password', 400);
            }

            await UserService.changePassword(req.user.id, current_password, new_password);
            return success(res, 'Đổi mật khẩu thành công');
        } catch (err) {
            const isClient = err.message.includes('không đúng') || err.message.includes('ít nhất');
            return error(res, err.message, isClient ? 400 : 500);
        }
    },

    // ===================== ADDRESS BOOK =====================
    async getAddresses(req, res) {
        try {
            const addresses = await UserService.getAddresses(req.user.id);
            return success(res, 'Danh sách địa chỉ', addresses);
        } catch (err) {
            return error(res, 'Server Error', 500);
        }
    },

    async addAddress(req, res) {
        try {
            const { full_name, phone, address_line, city, is_default } = req.body;
            if (!full_name || !phone || !address_line || !city) {
                return error(res, 'Thiếu thông tin địa chỉ (full_name, phone, address_line, city)', 400);
            }

            const id = await UserService.addAddress(req.user.id, {
                full_name, phone, address_line, city, is_default
            });
            return success(res, 'Thêm địa chỉ thành công', { id }, 201);
        } catch (err) {
            return error(res, 'Server Error', 500);
        }
    },

    async updateAddress(req, res) {
        try {
            const { full_name, phone, address_line, city, is_default } = req.body;
            await UserService.updateAddress(req.params.addressId, req.user.id, {
                full_name, phone, address_line, city, is_default
            });
            return success(res, 'Cập nhật địa chỉ thành công');
        } catch (err) {
            const isClient = err.message.includes('quyền') || err.message.includes('tồn tại');
            return error(res, err.message, isClient ? 403 : 500);
        }
    },

    async deleteAddress(req, res) {
        try {
            await UserService.deleteAddress(req.params.addressId, req.user.id);
            return success(res, 'Xóa địa chỉ thành công');
        } catch (err) {
            return error(res, err.message, 404);
        }
    },

    async setDefaultAddress(req, res) {
        try {
            await UserService.setDefaultAddress(req.params.addressId, req.user.id);
            return success(res, 'Đặt địa chỉ mặc định thành công');
        } catch (err) {
            return error(res, err.message, 404);
        }
    }
};

module.exports = UserController;
