import mongoose from 'mongoose';

// 1) Defina o sub‑schema de itens, com virtual precoItem
const itemSchema = new mongoose.Schema({
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
}, {
  toJSON:   { virtuals: true },
  toObject: { virtuals: true },
  id: false
});

// 2) Virtual que calcula precoItem = quantidade * produto.preco
itemSchema.virtual('precoItem').get(function() {
  // precisa ter populado produto para isso funcionar
  const precoUnit = this.produto?.preco ?? 0;
  return this.quantidade * precoUnit;
});

// 3) Agora o schema principal inclui o array de itemSchema
const carrinhoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  itens: [ itemSchema ],
  atualizadoEm: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON:   { virtuals: true },
  toObject: { virtuals: true },
  id: false
});

// 4) Virtual global (se ainda quiser) para precoTotal
carrinhoSchema.virtual('precoTotal').get(function() {
  return this.itens.reduce((sum, i) => sum + i.precoItem, 0);
});

const Carrinho = mongoose.model('Carrinho', carrinhoSchema);
export default Carrinho;
