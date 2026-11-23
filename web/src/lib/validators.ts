const EMAIL_FORMAT = /^[A-Z0-9._%+-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+$/i;

const VALID_DDDS = new Set([
  "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "21", "22", "24", "27", "28",
  "31", "32", "33", "34", "35", "37", "38",
  "41", "42", "43", "44", "45", "46", "47", "48", "49",
  "51", "53", "54", "55",
  "61", "62", "63", "64", "65", "66", "67", "68", "69",
  "71", "73", "74", "75", "77", "79",
  "81", "82", "83", "84", "85", "86", "87", "88", "89",
  "91", "92", "93", "94", "95", "96", "97", "98", "99",
]);

export function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }
  return digits;
}

export function formatBrazilPhone(value: string) {
  const digits = normalizePhone(value).slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length < 3) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length < 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function displayPhone(value?: string | null) {
  if (!value) return "";
  const digits = normalizePhone(value);
  if (digits.length === 10 || digits.length === 11) return formatBrazilPhone(digits);
  return value;
}

export function validateEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (!email) return "Informe um e-mail.";
  if (!EMAIL_FORMAT.test(email)) return "Use um e-mail completo, como nome@email.com.";
  return null;
}

export function validatePersonName(value: string) {
  const name = value.trim().replace(/\s+/g, " ");
  if (!name) return "Informe o nome completo.";
  if (name.length < 5) return "O nome está curto demais.";
  if (name.length > 80) return "O nome está longo demais.";
  if (!/^[\p{L}][\p{L}'’.\- ]+$/u.test(name)) return "Use apenas letras no nome.";
  const parts = name.split(" ");
  if (parts.length < 2 || !parts.some((part) => part.length >= 2)) return "Inclua nome e sobrenome.";
  return null;
}

export function validateStudioName(value: string) {
  const name = value.trim().replace(/\s+/g, " ");
  if (!name) return "Informe o nome do estúdio.";
  if (name.length < 2) return "O nome do estúdio está curto demais.";
  if (name.length > 80) return "O nome do estúdio está longo demais.";
  if (!/^[\p{L}0-9][\p{L}0-9 .&'’-]*$/u.test(name)) return "O nome do estúdio tem caracteres inválidos.";
  return null;
}

export function validateBrazilPhone(value: string, required = true) {
  const rawDigits = value.replace(/\D/g, "");
  const digits = normalizePhone(value);
  if (!digits) return required ? "Informe o WhatsApp com DDD." : null;
  if (rawDigits.length > 13) return "Esse número está longo demais.";
  if (!/^\d{10,11}$/.test(digits)) return "O WhatsApp precisa ter DDD e 8 ou 9 dígitos.";
  if (new Set(digits).size === 1) return "Esse número não parece real.";
  if (!VALID_DDDS.has(digits.slice(0, 2))) return "Esse DDD não existe.";
  if (digits.length === 11 && digits[2] !== "9") return "Celular precisa começar com 9 depois do DDD.";
  if (digits.length === 10 && !"2345".includes(digits[2])) return "Telefone fixo inválido depois do DDD.";
  return null;
}

export function validatePassword(value: string) {
  if (value.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return "Use letras e números na senha.";
  return null;
}

export function validateSlug(value: string) {
  if (!value) return "Escolha o link público do estúdio.";
  if (value.length < 3 || value.length > 40) return "O link precisa ter entre 3 e 40 caracteres.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) return "Use só letras minúsculas, números e hífen.";
  return null;
}

export function validateNotes(value: string) {
  if (value.length > 500) return "A descrição pode ter no máximo 500 caracteres.";
  return null;
}

export function validateInstagram(value: string) {
  const raw = value.trim();
  if (!raw) return null;
  const handle = raw
    .replace(/^https?:\/\/(?:www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .split("/")[0];
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) return "Use um @ de Instagram válido.";
  return null;
}

export function validatePolicy(value: string) {
  if (value.length > 800) return "A política pode ter no máximo 800 caracteres.";
  return null;
}

export function validateServiceName(value: string) {
  const name = value.trim().replace(/\s+/g, " ");
  if (!name) return "Informe o nome do serviço.";
  if (name.length < 3) return "O nome está curto demais.";
  if (name.length > 80) return "O nome está longo demais.";
  if (!/^[\p{L}0-9][\p{L}0-9 .&'’()/+–—-]*$/u.test(name)) return "O nome tem caracteres inválidos.";
  return null;
}

export function validateDuration(value: string) {
  if (!/^\d+$/.test(value.trim())) return "Informe a duração em minutos.";
  const minutes = Number(value);
  if (minutes < 15) return "A sessão precisa ter pelo menos 15 minutos.";
  if (minutes > 720) return "A duração máxima é 12 horas.";
  if (minutes % 5 !== 0) return "Use blocos de 5 minutos.";
  return null;
}

export function parsePriceToCents(value: string): { cents: number } | { error: string } {
  const raw = value.trim().replace(/\s/g, "").replace(/^R\$/i, "");
  if (!raw) return { cents: 0 };
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return { error: "Informe o preço em reais, como 450 ou 450,00." };
  const cents = Math.round(Number(normalized) * 100);
  if (cents >= 10_000_000) return { error: "Esse preço está alto demais." };
  return { cents };
}
