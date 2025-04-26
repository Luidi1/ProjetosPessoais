import isEmail from 'validator/lib/isEmail.js';

export function EhEmailValido(email) {
    if (typeof email !== 'string') return false;
    return isEmail(email, {
      allow_display_name: false,     // não aceita "Fulano <fulano@ex.com>"
      require_tld: true,             // força presença de .com, .org etc.
      allow_utf8_local_part: false,  // não aceita "usuário" com acentos
      allow_numeric_tld: false       // não aceita TLDs como .123
    });
}
  