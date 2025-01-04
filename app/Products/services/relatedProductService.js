const natural = require('natural');
const TfIdf = natural.TfIdf;

const combineProductFields = (product) => {
  return `${product.name} ${product.desc} ${product.category} ${product.gender}`;
};

const findRelatedProducts = (products, targetProductId) => {
  const tfidf = new TfIdf();

  // Add all products to the TF-IDF model
  products.forEach((product) => tfidf.addDocument(combineProductFields(product)));

  // Find the target product
  const targetProduct = products.find((product) => product._id.toString() === targetProductId);
  if (!targetProduct) return [];

  const targetText = combineProductFields(targetProduct);

  // Calculate similarity scores
  const scores = [];
  tfidf.tfidfs(targetText, (i, measure) => {
    scores.push({ productId: products[i]._id.toString(), score: measure });
  });

  // Sort and filter related products
  return scores
    .filter((item) => item.productId !== targetProductId) // Exclude the target product
    .sort((a, b) => b.score - a.score) // Sort by score
    .slice(0, 4); // Limit to 4 products
};

module.exports = { findRelatedProducts };
