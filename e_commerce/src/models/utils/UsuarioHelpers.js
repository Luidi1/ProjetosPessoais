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
export function anexarUsuarioHooks(usuarioSchema){
    usuarioSchema.pre('save', async function (next) {
        if (!this.nome || !this.data_nascimento) {
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
            const mes = seq;               // 1, 2, 3, ...
            const ano = 2000 + (seq - 1);    // 2000, 2001, 2002, ...
            this.data_nascimento = new Date(ano, mes - 1, 1);
          }
        }
        next();
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
}