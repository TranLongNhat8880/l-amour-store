const UserModel = require('./user.model');
const AddressModel = require('./address.model');
const { hashPassword, comparePassword } = require('../../utils/hashPassword');

const UserService = {
    // ===================== PROFILE =====================
    async getProfile(user_id) {
        const user = await UserModel.findById(user_id);
        if (!user) throw new Error('User not found');
        const { password, otp_code, otp_expires_at, ...safeUser } = user;
        return safeUser;
    },

    async updateProfile(user_id, data) {
        await UserModel.updateProfile(user_id, data);
        return await this.getProfile(user_id);
    },

    async changePassword(user_id, currentPassword, newPassword) {
        const user = await UserModel.findById(user_id);
        if (!user) throw new Error('User not found');

        const isMatch = await comparePassword(currentPassword, user.password);
        if (!isMatch) throw new Error('Mật khẩu hiện tại không đúng');

        if (newPassword.length < 6) throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');

        const hashed = await hashPassword(newPassword);
        await UserModel.updatePassword(user_id, hashed);
        return true;
    },

    // ===================== ADDRESS BOOK =====================
    async getAddresses(user_id) {
        return await AddressModel.findAllByUserId(user_id);
    },

    async addAddress(user_id, data) {
        return await AddressModel.create({ ...data, user_id });
    },

    async updateAddress(address_id, user_id, data) {
        const address = await AddressModel.findById(address_id);
        if (!address) throw new Error('Địa chỉ không tồn tại');
        if (address.user_id !== user_id) throw new Error('Bạn không có quyền sửa địa chỉ này');

        const affected = await AddressModel.update(address_id, { ...data, user_id });
        if (!affected) throw new Error('Cập nhật thất bại');
        return true;
    },

    async deleteAddress(address_id, user_id) {
        const affected = await AddressModel.delete(address_id, user_id);
        if (!affected) throw new Error('Không tìm thấy địa chỉ');
        return true;
    },

    async setDefaultAddress(address_id, user_id) {
        const affected = await AddressModel.setDefault(address_id, user_id);
        if (!affected) throw new Error('Không tìm thấy địa chỉ');
        return true;
    }
};

module.exports = UserService;
