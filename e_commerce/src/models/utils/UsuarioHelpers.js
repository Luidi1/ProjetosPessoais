import mongoose from "mongoose";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  seq:  { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

export const enderecoSchema = new mongoose.Schema({
  rua:        { type: String, required: true },
  numero:     { type: Number, required: true },
  complemento: { type: String, required: true },
  bairro:     { type: String, required: true },
  cidade:     { type: String, required: true },
  estado:     { type: String, required: true },
  cep:        { type: String, required: true },
  pais:       { type: String, required: true }
});

// Hook unificado para gerar nome, data_nascimento e endereco se não informados
export function anexarUsuarioHooks(usuarioSchema) {
  usuarioSchema.pre('validate', async function (next) {
    try {
      // 1) Em produção, não preenche defaults
      if (process.env.NODE_ENV === 'production') {
        return next();
      }

      // 2) Auto-fill de nome e data_nascimento
      if (!this.nome || !this.data_nascimento) {
        const count = await this.constructor.countDocuments();
        if (count === 0) {
          await Counter.findOneAndUpdate(
            { name: 'usuario' },
            { $set: { seq: 0 } },
            { new: true, upsert: true }
          );
        }
        const ret = await Counter.findOneAndUpdate(
          { name: 'usuario' },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
        if (!this.nome) {
          this.nome = `Nome${ret.seq}`;
        }
        if (!this.data_nascimento) {
          const dataBase = new Date(2000, 0, 1);
          dataBase.setDate(dataBase.getDate() + (ret.seq - 1));
          const ano = dataBase.getFullYear();
          const mes = String(dataBase.getMonth()+1).padStart(2, '0');
          const dia = String(dataBase.getDate()).padStart(2, '0');
          this.data_nascimento = `${ano}-${mes}-${dia}`;
        }
      }

      // 3) Auto-fill de endereco no ambiente dev/test
      if (!this.endereco || Object.keys(this.endereco).length === 0) {
        this.endereco = {
          rua: 'Rua Teste',
          numero: 1,
          complemento: 'Sem complemento',
          bairro: 'Centro',
          cidade: 'Cidade X',
          estado: 'SP',
          cep: '00000-000',
          pais: 'Brasil'
        };
      }

      return next();
    } catch (err) {
      return next(err);
    }
  });

  // Hook para hash da senha
  usuarioSchema.pre('save', async function (next) {
    if (!this.isModified('senha')) return next();
    try {
      this.senha = await bcrypt.hash(this.senha, SALT_ROUNDS);
      next();
    } catch (err) {
      next(err);
    }
  });

  // Formatação de saída JSON e reordenação de chaves
  usuarioSchema.set('toJSON', {
    transform(doc, ret) {
      if (ret.data_nascimento) {
        const iso = new Date(ret.data_nascimento).toISOString();
        ret.data_nascimento = iso.split('T')[0];
      }
      const { _id, nome, data_nascimento, email, senha, endereco, __v, ...rest } = ret;
      return { _id, nome, data_nascimento, email, senha, endereco, __v, ...rest };
    }
  });
}
