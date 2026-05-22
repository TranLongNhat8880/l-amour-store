const AiService = require('./ai.service');
const { success, error } = require('../../utils/response');

const AiController = {
    async consult(req, res) {
        try {
            const { message, history } = req.body;
            const text = await AiService.consult(message, history);
            return success(res, 'AI Response', { text });
        } catch (err) {
            console.error('AI Error Details:', err);
            if (err.statusCode === 503) return error(res, err.message, 503);
            const errorMsg = err.message.includes('503')
                ? "L'Amour Muse hiện đang bận tư vấn cho quá nhiều nàng thơ khác. Nàng vui lòng đợi một chút hoặc thử lại sau nhé!"
                : `L'Amour Muse đang nghỉ ngơi: ${err.message}`;
            return error(res, errorMsg, 500);
        }
    }
};

module.exports = AiController;
