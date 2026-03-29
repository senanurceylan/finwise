/**
 * Kategori: API (Türkçe) <-> Prisma enum eşlemesi.
 * Frontend Gıda, Ulaşım vb. kullanır; veritabanında GIDA, ULASIM saklanır.
 */
const { ExpenseCategory } = require('@prisma/client');

const TO_ENUM = {
  Gıda: ExpenseCategory.GIDA,
  Ulaşım: ExpenseCategory.ULASIM,
  Fatura: ExpenseCategory.FATURA,
  Eğlence: ExpenseCategory.EGLENCE,
  'Teknolojik Alet': ExpenseCategory.TEKNOLOJIK_ALET,
  Diğer: ExpenseCategory.DIGER,
};

const TO_LABEL = {
  [ExpenseCategory.GIDA]: 'Gıda',
  [ExpenseCategory.ULASIM]: 'Ulaşım',
  [ExpenseCategory.FATURA]: 'Fatura',
  [ExpenseCategory.EGLENCE]: 'Eğlence',
  [ExpenseCategory.TEKNOLOJIK_ALET]: 'Teknolojik Alet',
  [ExpenseCategory.DIGER]: 'Diğer',
};

const VALID_CATEGORIES = Object.keys(TO_ENUM);

function toEnum(label) {
  return TO_ENUM[label] ?? null;
}

function toLabel(enumValue) {
  return TO_LABEL[enumValue] ?? enumValue;
}

module.exports = { toEnum, toLabel, VALID_CATEGORIES, ExpenseCategory };
