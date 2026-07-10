const express = require('express');
const { readData } = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  let products = readData('products.json');
  const { mainCategory, subCategory } = req.query;

  if (mainCategory) {
    const wanted = mainCategory.trim().toLowerCase();
    products = products.filter(p => p.mainCategory && p.mainCategory.trim().toLowerCase() === wanted);
  }

  if (subCategory) {
    const wantedSub = subCategory.trim().toLowerCase();
    products = products.filter(p => p.subCategory && p.subCategory.trim().toLowerCase() === wantedSub);
  }

  res.json(products);
});

router.get('/:id', (req, res) => {
  const products = readData('products.json');
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.json(product);
});

module.exports = router;
