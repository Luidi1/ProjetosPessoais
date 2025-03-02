// Exemplo de função que faz a formatação
function formatarMensagens(mensagens) {
    const total = mensagens.length;
  
    const mensagensFormatadas = mensagens.map((msg, index) => {
      // Se a mensagem não terminar em ., ! ou ?, adiciona .
      if (!/[.!?]$/.test(msg)) {
        msg += ".";
      }
  
      // Se não for a última mensagem, substitui a pontuação final por ;
      if (index < total - 1) {
        return msg.replace(/[.!?]+$/, ';');
      }
  
      // Última mensagem fica como está (já com . se não tinha)
      return msg;
    });
  
    // Junta todas com espaço
    return mensagensFormatadas.join(' ');
}
  
// Exporta para usar em outros arquivos
export default formatarMensagens;
  