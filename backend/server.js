const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
require('dotenv').config();

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Stripe secret key loaded from .env

app.use(cors());
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { customer, items } = req.body;

        // Format line items for Stripe
        const line_items = items.map(item => ({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: item.name,
                },
                unit_amount: Math.round(item.price * 100), // Convert EUR to cents
            },
            quantity: item.quantity,
        }));

        // Add shipping as a line item (fixed price)
        line_items.push({
            price_data: {
                currency: 'eur',
                product_data: { name: 'Versand' },
                unit_amount: 299, // 2.99 EUR shipping
            },
            quantity: 1,
        });

        // Allowed shipping countries
        const shipping_address_collection = {
            allowed_countries: ['DE', 'AT', 'CH']
        };

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            customer_email: customer.email,
            shipping_address_collection,
            success_url: 'http://localhost:3000/success',
            cancel_url: 'http://localhost:3000/cancel',
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

// Start the server
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});