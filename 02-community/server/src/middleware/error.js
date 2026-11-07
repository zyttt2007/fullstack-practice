/** 统一错误结构：{ error: { message } } */
export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/** 包装 async 控制器，异常自动交给错误中间件 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(req, res) {
  res.status(404).json({ error: { message: `接口不存在：${req.method} ${req.originalUrl}` } });
}

export function errorHandler(err, _req, res, _next) {
  if (err.status !== 401 && err.status !== 403) {
    console.error('[error]', err.message);
  }
  res.status(err.status || 500).json({
    error: { message: err.message || '服务器内部错误' },
  });
}
