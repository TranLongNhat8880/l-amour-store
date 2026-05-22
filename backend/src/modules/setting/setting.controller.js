const SettingModel = require('./setting.model');
const { success, error } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const SettingController = {
  getHeroBanner: asyncHandler(async (req, res) => {
    const banner = await SettingModel.get('hero_banner');
    return success(res, 'Hero banner retrieved', banner);
  }),

  updateHeroBanner: asyncHandler(async (req, res) => {
    let { imageUrl, title, subtitle, description, buttonText } = req.body;
    
    // Nếu có file upload, ưu tiên dùng URL từ file đó (Cloudinary)
    if (req.file) {
      imageUrl = req.file.path;
    }

    if (!imageUrl || !title) {
      return error(res, 'Hình ảnh và tiêu đề không được để trống', 400);
    }

    const updated = await SettingModel.update('hero_banner', {
      imageUrl,
      title,
      subtitle,
      description,
      buttonText
    });

    return success(res, 'Hero banner updated successfully', updated);
  })
};

module.exports = SettingController;
