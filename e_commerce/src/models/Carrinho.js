import mongoose from 'mongoose';

const carrinhoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  itens: [
    {
      produto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Produto',
        required: true
      },
      quantidade: {
        type: Number,
        required: true,
        min: [1, 'Quantidade mínima é 1']
      }
    }
  ],
  atualizadoEm: {
    type: Date,
    default: Date.now
  }
});

const Carrinho = mongoose.model('Carrinho', carrinhoSchema);
export default Carrinho;
