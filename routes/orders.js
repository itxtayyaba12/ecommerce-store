const express = require('express');
const { readData, writeData } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.post('/', authenticateToken, (req, res) => {
  const { items } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty.' });
  }

  const products = readData('products.json');
  let total = 0;
  const orderItems = [];

  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) return res.status(400).json({ message: `Product ${item.productId} not found.` });
    if (product.stock < item.qty) {
      return res.status(400).json({ message: `${product.name} is out of stock.` });
    }
    total += product.price * item.qty;
    orderItems.push({ productId: product.id, name: product.name, price: product.price, qty: item.qty });
    product.stock -= item.qty;
  }

  writeData('products.json', products);

  const orders = readData('orders.json');
  const newOrder = {
    id: Date.now(),
    userId: req.user.id,
    items: orderItems,
    total,
    status: 'Processing',
    createdAt: new Date().toISOString()
  };
  orders.push(newOrder);
  writeData('orders.json', orders);

  res.status(201).json({ message: 'Order placed successfully!', order: newOrder });
});

router.get('/my', authenticateToken, (req, res) => {
  const orders = readData('orders.json');
  const myOrders = orders.filter(o => o.userId === req.user.id);
  res.json(myOrders);
});

module.exports = router;