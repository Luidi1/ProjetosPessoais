// src/models/Pedido.js
import mongoose from 'mongoose';

// Sub-schema para itens de pedido
const itemPedidoSchema = new mongoose.Schema({
  produto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produto',
    required: true
  },
  quantidade: {
    type: Number,
    required: true,
    min: [1, 'Quantidade mínima é 1']
  },
  precoUnitario: {
    type: Number,
    required: true,
    min: [0, 'Preço unitário inválido']
  },
  precoItem: {
    type: Number,
    required: true,
    min: [0, 'Preço do item inválido']
  }
}, {
  id: false
});

// Schema principal de Pedido
const pedidoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  itens: [ itemPedidoSchema ],
  valorTotal: {
    type: Number,
    required: true,
    min: [0, 'Valor total inválido']
  },
  status: {
    type: String,
    enum: ['PENDENTE', 'PAGO', 'ENVIADO', 'CANCELADO'],
    default: 'PENDENTE'
  },
  formaPagamento: {
    type: String,
    enum: ['BOLETO', 'CARTAO_CREDITO', 'PIX'],
    required: true
  },
  pagoEm: {
    type: Date
  },
  enderecoEntrega: {
    rua: { type: String, required: true },
    numero: { type: String, required: true },
    bairro: { type: String, required: true },
    cidade: { type: String, required: true },
    uf: { type: String, required: true, uppercase: true, maxlength: 2 },
    cep: { type: String, required: true }
  }
}, {
  timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },
  id: false,
});

export default mongoose.model('Pedido', pedidoSchema);