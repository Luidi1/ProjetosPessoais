// src/utils/skipOnTest.js
export default function skipOnTest(middleware) {
    return (req, res, next) => {
      if (process.env.NODE_ENV === 'test') {
        return next();
      }
      return middleware(req, res, next);
    };
}
  