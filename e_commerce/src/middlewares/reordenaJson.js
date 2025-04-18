// src/middlewares/reordenaJson.js
export default function reordenaJson(req, res, next) {
    const originalJson = res.json.bind(res);
  
    res.json = (data) => {
      // 1) Conversão recursiva de todos os Mongoose Docs em POJOs, incluindo sub-documentos
      const convert = (obj) => {
        if (obj && typeof obj.toObject === 'function') {
          return convert(obj.toObject({ virtuals: true }));
        }
        if (Array.isArray(obj)) {
          return obj.map(convert);
        }
        if (obj && obj.constructor === Object) {
          const ret = {};
          for (const key of Object.keys(obj)) {
            ret[key] = convert(obj[key]);
          }
          return ret;
        }
        return obj;
      };
  
      let payload = convert(data);
  
      // 2) Reordena apenas object literals e garante __v por fim
      const reorder = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(reorder);
        }
        if (obj && obj.constructor === Object) {
          const ret = {};
          // sempre primeiro _id
          if ('_id' in obj) {
            ret._id = obj._id;
          }
          // armazena __v para adicionar por último
          const hasVersion = '__v' in obj;
          const versionValue = hasVersion ? obj.__v : undefined;
          // adiciona todas as outras chaves, exceto _id e __v
          for (const key of Object.keys(obj)) {
            if (key === '_id' || key === '__v') continue;
            ret[key] = reorder(obj[key]);
          }
          // adiciona __v ao final, se existia
          if (hasVersion) {
            ret.__v = versionValue;
          }
          return ret;
        }
        return obj;
      };
  
      payload = reorder(payload);
  
      // 3) Formata preços para padrão brasileiro
      const formatPrices = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(formatPrices);
        }
        if (obj && obj.constructor === Object) {
          for (const key of Object.keys(obj)) {
            const val = obj[key];
            if ((key === 'preco' || key === 'precoItem' || key === 'precoTotal') && typeof val === 'number') {
              obj[key] = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
            } else {
              obj[key] = formatPrices(val);
            }
          }
          return obj;
        }
        return obj;
      };
  
      payload = formatPrices(payload);
  
      return originalJson(payload);
    };
  
    next();
}
  