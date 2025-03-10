// Exemplo de função que faz a formatação
export function formatarListaDeMensagens(mensagens) {
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

export function concatenarItensComVirgulaAndE(lista) {
  if (lista.length === 0) return "";
  if (lista.length === 1) return lista[0];
  if (lista.length === 2) return lista.join(" e ");
  
  const ultimo = lista.pop();
  return lista.join(", ") + " e " + ultimo;
}
  