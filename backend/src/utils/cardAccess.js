const { prisma } = require('./prisma');

async function assertCardOwnedByUser(cardId, userId) {
  if (!cardId) return null;
  const card = await prisma.paymentCard.findFirst({
    where: { id: cardId, userId },
  });
  if (!card) {
    const err = new Error('Kart bulunamadı veya size ait değil.');
    err.statusCode = 400;
    throw err;
  }
  return card;
}

module.exports = { assertCardOwnedByUser };
