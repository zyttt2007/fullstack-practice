import { Router } from 'express';
import { register, login, me, updateProfile } from '../controllers/authController.js';
import { listProducts, getProduct } from '../controllers/productController.js';
import { getCart, addToCart, updateCartItem, removeCartItem } from '../controllers/cartController.js';
import { listAddresses, createAddress, updateAddress, deleteAddress } from '../controllers/addressController.js';
import { createOrder, listOrders, getOrder, cancelOrder, payOrder } from '../controllers/orderController.js';
import { listCoupons } from '../controllers/couponController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', requireAuth, me);
router.put('/auth/profile', requireAuth, updateProfile);

router.get('/products', listProducts);
router.get('/products/:id', getProduct);

router.get('/cart', requireAuth, getCart);
router.post('/cart', requireAuth, addToCart);
router.put('/cart/:id', requireAuth, updateCartItem);
router.delete('/cart/:id', requireAuth, removeCartItem);

router.get('/addresses', requireAuth, listAddresses);
router.post('/addresses', requireAuth, createAddress);
router.put('/addresses/:id', requireAuth, updateAddress);
router.delete('/addresses/:id', requireAuth, deleteAddress);

router.post('/orders', requireAuth, createOrder);
router.get('/orders', requireAuth, listOrders);
router.get('/orders/:id', requireAuth, getOrder);
router.put('/orders/:id/cancel', requireAuth, cancelOrder);
router.put('/orders/:id/pay', requireAuth, payOrder);

router.get('/coupons', requireAuth, listCoupons);

export default router;
