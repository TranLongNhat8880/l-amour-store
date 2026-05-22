/**
 * Async Handler Wrapper
 * Giúp loại bỏ việc lặp lại try-catch trong các hàm async.
 * Nó sẽ tự động bắt lỗi và chuyển tiếp (next) tới middleware xử lý lỗi tập trung.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
