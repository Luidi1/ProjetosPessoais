import { EhEmailValido } from "../emailValidacao.js";

describe('Validação de e-mail', () => {
  // Lista de e-mails que devem ser considerados inválidos
  const invalidos = [
    '',                       // string vazia
    '    ',                   // apenas espaços
    'usuario.com',            // sem "@"
    '@dominio.com',           // sem parte local
    'usuario@',               // sem domínio
    'usuario@dominio',        // sem TLD
    'usuario@dominio.',       // ponto sem TLD
    'usuario@@dominio.com',   // dois "@"
    'us..uario@dominio.com',  // dois pontos consecutivos na parte local
    '.usuario@dominio.com',   // começa com ponto na parte local
    'usuario.@dominio.com',   // termina com ponto na parte local
    'usuario@.dominio.com',   // ponto logo após "@"
    'usuario@dominio..com',   // dois pontos consecutivos no domínio
    'us er@dominio.com',      // espaço na parte local
    'usuario@dom inio.com',   // espaço no domínio
    'usuario@dominio,com',    // vírgula em vez de ponto
    'usuario@-dominio.com',   // domínio começa com hífen
    'usuario@dominio-.com',   // domínio termina com hífen
    'usuario@dominio.c',      // TLD de um só caractere
    'usuario@dominio.123',    // TLD só numérico
    'usuário@domínio.com',    // caracteres acentuados
    'user(name)@dominio.com'  // parênteses na parte local
  ];

  test.each(invalidos)('rejeita e-mail inválido: "%s"', (email) => {
    expect(EhEmailValido(email)).toBe(false);
  });

  // Lista de e-mails que devem ser considerados válidos
  const validos = [
    'usuario@dominio.com',
    'nome.sobrenome@empresa.org.br',
    'user+tag@gmail.com',
    'user_name@sub.dominio.com',
    'user-name@dominio.co',
    'user123@dominio123.com',
    'u@d.co',                // mínimo de caracteres
    'usuario@dominio.travel' // TLD longo
  ];

  test.each(validos)('aceita e-mail válido: "%s"', (email) => {
    expect(EhEmailValido(email)).toBe(true);
  });
});
