// src/middlewares/reordenaJson.js
export default function reordenaJson(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (data) => {
    // 1) Conversão recursiva de Mongoose Docs em POJOs
    const convert = (obj) => {
      if (obj && typeof obj.toObject === 'function') {
        return convert(obj.toObject({ virtuals: true }));
      }
      if (Array.isArray(obj)) {
        return obj.map(convert); //Equivalente a: map((item) => convert(item))
      }
      if (obj && obj.constructor === Object) {
        const ret = {};
        for (const key of Object.keys(obj)) ret[key] = convert(obj[key]); //E se tivesse return antes do convert? Oq aconteceria?
        return ret;
      }
      return obj;
    };

    let payload = convert(data);

    // 2) Reordena as chaves na ordem desejada:
    // _id, email, senha, perfil, nome, data_nascimento, endereco, depois quaisquer outras, e __v
    const reorder = (obj) => {
      if (Array.isArray(obj)) return obj.map(reorder);
      if (obj && obj.constructor === Object) {
        const ret = {};
        const hasVersion = '__v' in obj;
        const versionValue = hasVersion ? obj.__v : undefined;

        // Campos na ordem fixa
        if ('_id' in obj) ret._id = obj._id;
        if ('nome' in obj) ret.nome = obj.nome;
        if ('email' in obj) ret.email = obj.email;
        if ('senha' in obj) ret.senha = obj.senha;
        if ('perfil' in obj) ret.perfil = obj.perfil;
        if ('data_nascimento' in obj) ret.data_nascimento = obj.data_nascimento;
        if ('endereco' in obj) ret.endereco = reorder(obj.endereco);

        // Demais chaves não listadas acima e nem __v
        for (const key of Object.keys(obj)) {
          if (['_id','email','senha','perfil','nome','data_nascimento','endereco','__v'].includes(key)) continue;
          ret[key] = reorder(obj[key]);
        }

        // Versão por último
        if (hasVersion) ret.__v = versionValue;
        return ret;
      }
      return obj;
    };

    payload = reorder(payload);

    // 3) Formata preços no padrão brasileiro
    const formatPrices = (obj) => {
      if (Array.isArray(obj)) return obj.map(formatPrices);
      if (obj && obj.constructor === Object) {
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          if ((key === 'preco' || key === 'precoItem' || key === 'precoTotal' || key === 'valorTotal') && typeof val === 'number') {
            obj[key] = new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(val);
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
