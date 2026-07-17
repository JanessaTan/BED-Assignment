const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const customerModel = require('../models/customerModel');

// POST /api/auth/register (US-1: Create Account)
async function register(req,res) {
    try {
        const { name, email, password } = req.body;

        // basic input validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'name, email and password are required' });
        }
        if (password.length <6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // check if email already registered
        const existing = await customerModel.getCustomerByEmmail(email);
        if (existing) {
            return res.status(409).json({ message: 'An account with this email already exists' });
        }

        // hash password before storing - never store plain text 
        const hashedPassword = await bcrypt.hash(password, 10);
        const newCustomer = await customerModel.createCustomer(name, email, hashedPassword);

        res.status(201).json({ message: 'Account created successfully', customer: newCustomer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating account', error: err.message });
    }
}

// POST /api/auth/login (US-2: Login)
async function login(req, res) {
    try{
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'email and password are required'});
        }

        const customer = await customerModel.getCustomerByEmail(email);
        if (!customer) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const passwordMatches = await bcrypt.compare(password, customer.Password);
        if (!passwordMatches) {
            return res.status(401).json({ message: 'Invalid email or password' });

        }

        // create a JWT so the customer stays logged in for later requests
        const token = jwt.sign(
            { customerId: customer.CustomerID, email: customer.Email },
            process.env. JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        res.status(200).json({
            message: 'Login successful',
            token,
            customer: { customerId: customer.CustomerID, name: customer.Name, email: customer.Email }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error logging in', error: err.message });
    }
}

module.exports = {register, login };