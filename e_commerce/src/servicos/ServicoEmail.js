import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  APP_URL,
  NODE_ENV
} = process.env;

/**
 * Envia um e-mail de verificação de conta.
 * Em modo de teste (NODE_ENV === 'test'), usa o Ethereal para gerar uma conta temporária.
 * Caso contrário, usa as credenciais SMTP configuradas.
 */
export async function sendVerificationEmail(toEmail, token) {
  // 1) Cria/transporter de envio de e-mail
  let transporter;
  if (NODE_ENV === 'test') {
    // Conta de sandbox Ethereal para testes
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
  } else {
    // SMTP real ou Mailtrap
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
  }

  // 2) Formata o link de verificação e HTML do e-mail
  const verifyUrl = `${APP_URL}/usuarios/confirmar/${token}`;
  const html = `
    <p>Olá!</p>
    <p>Clique para confirmar seu e-mail:</p>
    <a href="${verifyUrl}">${verifyUrl}</a>
    <p>Se não for você, ignore.</p>
  `;

  // 3) Envia o e-mail
  const info = await transporter.sendMail({
    from: `"Meu App" <${SMTP_USER}>`,
    to: toEmail,
    subject: 'Confirme seu e-mail',
    html
  });
}
