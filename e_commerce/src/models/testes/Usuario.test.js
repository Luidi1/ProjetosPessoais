// usuario.test.js
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Usuario from '../Usuario.js'; // Ajuste o caminho conforme seu projeto
import bcrypt from 'bcrypt';

let mongoServer;

describe('Testes do Schema de Usuario', () => {
  // Conecta no Mongo em memória antes de todos os testes
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  // **Cria (ou recria) os índices antes de cada teste**
  beforeEach(async () => {
    await Usuario.init();
  });

  // Limpa a base de dados após cada teste (para isolar os cenários)
  afterEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  // Desconecta e para o servidor em memória após todos os testes
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('Deve gerar nome e data_nascimento se não forem informados', async () => {
    const usuario = new Usuario({
      email: 'teste@exemplo.com',
      senha: '123456',
    });
    const savedUsuario = await usuario.save();

    // Verifica se o nome foi gerado automaticamente
    expect(savedUsuario.nome).toMatch(/^Nome\d+$/);

    // Verifica se a data_nascimento foi gerada
    expect(savedUsuario.data_nascimento).toBeInstanceOf(Date);
  });

  it('Não deve sobrescrever nome e data_nascimento se já forem informados', async () => {
    const usuario = new Usuario({
      nome: 'João',
      data_nascimento: new Date('1990-05-20'),
      email: 'joao@exemplo.com',
      senha: 'abcdef',
    });
    const savedUsuario = await usuario.save();

    expect(savedUsuario.nome).toBe('João');
    expect(savedUsuario.data_nascimento.toISOString())
      .toBe(new Date('1990-05-20').toISOString());
  });

  it('Deve rejeitar data de nascimento antes de 1900-01-01', async () => {
    const usuario = new Usuario({
      email: 'antigo@exemplo.com',
      senha: '123456',
      data_nascimento: new Date('1899-12-31'),
    });

    let erro;
    try {
      await usuario.validate(); // ou usuario.save()
    } catch (err) {
      erro = err;
    }
    expect(erro).toBeDefined();
    expect(erro.errors['data_nascimento']).toBeDefined();
    expect(erro.errors['data_nascimento'].message).toMatch(/a partir de 01\/01\/1900/i);
  });

  it('Deve rejeitar usuário com menos de 18 anos', async () => {
    const hoje = new Date();
    const dataMenorIdade = new Date(
      hoje.getFullYear() - 10,
      hoje.getMonth(),
      hoje.getDate()
    );

    const usuario = new Usuario({
      email: 'menor@exemplo.com',
      senha: '123456',
      data_nascimento: dataMenorIdade,
    });

    let erro;
    try {
      await usuario.validate(); // ou usuario.save()
    } catch (err) {
      erro = err;
    }
    expect(erro).toBeDefined();
    expect(erro.errors['data_nascimento']).toBeDefined();
    expect(erro.errors['data_nascimento'].message).toMatch(/pelo menos 18 anos/i);
  });

  it('Deve validar email correto e rejeitar email inválido', async () => {
    // Primeiro: email válido
    const usuarioValido = new Usuario({
      email: 'valido@exemplo.com',
      senha: '123456',
    });
    let erroValido;
    try {
      await usuarioValido.validate();
    } catch (err) {
      erroValido = err;
    }
    expect(erroValido).toBeUndefined(); // não deve ter erro

    // Depois: email inválido
    const usuarioInvalido = new Usuario({
      email: 'invalido',
      senha: '123456',
    });
    let erroInvalido;
    try {
      await usuarioInvalido.validate();
    } catch (err) {
      erroInvalido = err;
    }
    expect(erroInvalido).toBeDefined();
    expect(erroInvalido.errors['email']).toBeDefined();
  });

  it('Deve rejeitar emails duplicados', async () => {
    const emailDuplicado = 'dup@exemplo.com';

    // Cria o primeiro usuário
    await Usuario.create({
      email: emailDuplicado,
      senha: '123456',
    });

    // Tenta criar o segundo usuário com o mesmo email
    let erro;
    try {
      await Usuario.create({
        email: emailDuplicado,
        senha: 'abcdef',
      });
    } catch (err) {
      erro = err;
    }

    // Verifica se o erro foi disparado
    expect(erro).toBeDefined();
    // Código de erro 11000 = duplicidade
    expect(erro.code).toBe(11000);
  });

  it('Deve fazer o hash da senha ao salvar', async () => {
    const senhaPura = 'senha123';
    const usuario = new Usuario({
      email: 'hash@exemplo.com',
      senha: senhaPura,
    });

    const savedUsuario = await usuario.save();
    // Verifica se a senha armazenada não é a mesma
    expect(savedUsuario.senha).not.toBe(senhaPura);

    // Opcional: checa se bcrypt.compare funciona
    const match = await bcrypt.compare(senhaPura, savedUsuario.senha);
    expect(match).toBe(true);
  });

  it('Não deve re-hash se a senha não for modificada', async () => {
    // Cria usuário
    const usuario = new Usuario({
      email: 'nao-rehash@exemplo.com',
      senha: 'minhaSenha',
    });
    const savedUsuario = await usuario.save();
    const senhaHasheada = savedUsuario.senha;

    // Atualiza outro campo (por exemplo, nome)
    savedUsuario.nome = 'Novo Nome';
    const updatedUsuario = await savedUsuario.save();

    // Verifica se a senha permanece a mesma
    expect(updatedUsuario.senha).toBe(senhaHasheada);
  });

  it('Deve re-hash se a senha for modificada', async () => {
    const usuario = new Usuario({
      email: 'rehash@exemplo.com',
      senha: 'senhaAntiga',
    });
    const savedUsuario = await usuario.save();
    const senhaHasheadaAntiga = savedUsuario.senha;

    // Altera a senha
    savedUsuario.senha = 'senhaNova';
    const updatedUsuario = await savedUsuario.save();

    expect(updatedUsuario.senha).not.toBe(senhaHasheadaAntiga);
    const matchNova = await bcrypt.compare('senhaNova', updatedUsuario.senha);
    expect(matchNova).toBe(true);
  });

  it('Deve criar múltiplos usuários simultaneamente sem duplicar nome', async () => {
    // Teste de concorrência: cria vários usuários ao mesmo tempo
    const numUsers = 5;
    const promises = [];
    for (let i = 0; i < numUsers; i++) {
      promises.push(
        Usuario.create({
          email: `concorrente${i}@exemplo.com`,
          senha: `senha${i}`,
        })
      );
    }
    const resultados = await Promise.all(promises);

    // Verifica se cada usuário recebeu um nome diferente (Nome1, Nome2, etc.)
    const nomes = resultados.map(u => u.nome);
    expect(new Set(nomes).size).toBe(numUsers);
  });

  it('Deve aceitar endereço se fornecido', async () => {
    const usuario = new Usuario({
      email: 'endereco@exemplo.com',
      senha: 'senhaEndereco',
      endereco: {
        rua: 'Rua Teste',
        numero: 123,
        cidade: 'Cidade Teste'
      }
    });
    const savedUsuario = await usuario.save();
    expect(savedUsuario.endereco.rua).toBe('Rua Teste');
    expect(savedUsuario.endereco.numero).toBe(123);
    expect(savedUsuario.endereco.cidade).toBe('Cidade Teste');
  });
});
