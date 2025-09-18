const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
require('dotenv').config();

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { customer, items } = req.body;

        const line_items = items.map(item => ({
            price_data: {
                currency: 'eur',
                product_data: { name: item.name },
                unit_amount: Math.round(item.price * 100)
            },
            quantity: item.quantity
        }));

        // Add fixed shipping
        line_items.push({
            price_data: {
                currency: 'eur',
                product_data: { name: 'Versand' },
                unit_amount: 399
            },
            quantity: 1
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            customer_email: customer.email,
            shipping_address_collection: { allowed_countries: ['DE', 'AT', 'CH'] },
            success_url: `${process.env.FRONTEND_URL}/success`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
            metadata: {
                name: customer.name,
                address: customer.address,
                city: customer.city,
                zip: customer.zip,
                country: customer.country
            }
        });

        res.json({ sessionId: session.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
