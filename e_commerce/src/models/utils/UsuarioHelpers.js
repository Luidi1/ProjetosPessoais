import mongoose from "mongoose";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

export const enderecoSchema = new mongoose.Schema({
  rua: { type: String },
  numero: { type: Number },
  complemento: { type: String },
  bairro: { type: String },
  cidade: { type: String },
  estado: { type: String },
  cep: { type: String },
  pais: { type: String }
});

// Hook unificado para gerar nome e data_nascimento se não informados
export function anexarUsuarioHooks(usuarioSchema) {
  usuarioSchema.pre('validate', async function (next) {
    try{

      if (!this.nome || !this.data_nascimento) {
        // Se não houver nenhum usuário na coleção, reseta o contador
        const count = await this.constructor.countDocuments();
        if (count === 0) {
          await Counter.findOneAndUpdate(
            { name: 'usuario' },
            { $set: { seq: 0 } },
            { new: true, upsert: true }
          );
        }
        
        // Incrementa o contador para obter o novo valor de seq
        const ret = await Counter.findOneAndUpdate(
          { name: 'usuario' },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
  
        if (!this.nome) {
          this.nome = `Nome${ret.seq}`;
        }
  
        if (!this.data_nascimento) {
          const seq = ret.seq;
          const dataBase = new Date(2000, 0, 1); // 1º de janeiro de 2000
          // Adiciona (seq - 1) dias à data base, fazendo a rolagem automática de dias, meses e ano
          dataBase.setDate(dataBase.getDate() + (seq - 1));
          // Converte a data para string no formato YYYY-MM-DD para que o TipoData possa fazer o cast
          const ano = dataBase.getFullYear();
          const mes = String(dataBase.getMonth() + 1).padStart(2, '0');
          const dia = String(dataBase.getDate()).padStart(2, '0');
          this.data_nascimento = `${ano}-${mes}-${dia}`;
        }
      }
      next();
    } catch(erro){
      next(erro);
    }
  });

  // Hook para realizar o hash da senha, se necessário
  usuarioSchema.pre('save', async function (next) {
    if (!this.isModified('senha')) {
      return next();
    }

    try {
      const hash = await bcrypt.hash(this.senha, SALT_ROUNDS);
      this.senha = hash;
      next();
    } catch (err) {
      next(err);
    }
  });

  usuarioSchema.set('toJSON', {
    transform: function (doc, ret) {
      // Formata a data para ISO (YYYY-MM-DD) se existir
      if (ret.data_nascimento) {
        const isoCompleto = new Date(ret.data_nascimento).toISOString();
        ret.data_nascimento = isoCompleto.split("T")[0];
      }
      
      // Reordena as chaves conforme desejado
      const { _id, nome, data_nascimento, email, senha, endereco, __v, ...resto } = ret;
      return {
        _id,
        nome,
        data_nascimento,
        email,
        senha,
        endereco,
        __v,
        ...resto
      };
    }
  });  
}
