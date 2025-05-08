const express = require('express');
const { Client } = require('pg');
const bodyParser = require('body-parser');
const createError = require('http-errors');
require('dotenv').config();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const client = new Client({
    user: 'yakshat',
    host: 'localhost',
    database: 'task',
    password: 'pipaliya4609',
    port: 5432,
});

client.connect()
    .then(() => {
        console.log('Connected to PostgreSQL!');
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS ecommerce (
                id SERIAL PRIMARY KEY,
                product VARCHAR(255) NOT NULL,
                category VARCHAR(255) NOT NULL,
                amount NUMERIC
            );
        `;
        return client.query(createTableQuery);
    })
    .then(() => {
        console.log('Ecommerce table is ready!');
    })
    .catch(err => console.error('Connection error or table creation failed', err));

app.get('/', (req, res, next) => {
    const qry = `SELECT * FROM ecommerce ORDER BY id ASC`;
    client.query(qry, (error, result) => {
        if (error) {
            console.error(error);
            return next(createError(500, 'Database error'));
        }
        res.render('index', { result: result.rows, editResult: null });
    });
});

app.post('/createData', (req, res, next) => {
    const { id, product, category, amount } = req.body;

    if (!product || !category) {
        return next(createError(400, 'Product and category are required'));
    }

    let qry;

    if (id && id.trim() !== '') {
        qry = {
            text: `UPDATE ecommerce SET product=$1, category=$2, amount=$3 WHERE id=$4`,
            values: [product, category, amount, id],
        };
    } else {
        qry = {
            text: `INSERT INTO ecommerce (product, category, amount) VALUES ($1, $2, $3)`,
            values: [product, category, amount],
        };
    }

    client.query(qry, (error) => {
        if (error) {
            console.error(error);
            return next(createError(500, 'Database error'));
        }
        console.log("Data saved successfully");
        res.redirect('/');
    });
});

app.get('/editData', (req, res, next) => {
    const editId = req.query.edit;

    client.query('SELECT * FROM ecommerce WHERE id = $1', [editId], (error, editResult) => {
        if (error) {
            console.error(error);
            return next(createError(500, 'Database error'));
        }

        client.query('SELECT * FROM ecommerce ORDER BY id ASC', (error, result) => {
            if (error) {
                console.error(error);
                return next(createError(500, 'Database error'));
            }
            res.render('index', {
                editResult: editResult.rows[0],
                result: result.rows
            });
        });
    });
});

app.post('/deleteData', (req, res, next) => {
    const { id } = req.body;

    if (!id) {
        return next(createError(400, 'ID is required for deletion'));
    }

    const qry = {
        text: `DELETE FROM ecommerce WHERE id=$1`,
        values: [id],
    };

    client.query(qry, (error) => {
        if (error) {
            console.error(error);
            return next(createError(500, 'Database error'));
        }
        console.log("Data deleted successfully");
        res.redirect('/');
    });
});

app.get('/sum', (req, res, next) => {
    const query = `
        SELECT category, SUM(amount) AS total_sales
        FROM ecommerce
        GROUP BY category
        ORDER BY category;
    `;

    client.query(query, (error, result) => {
        if (error) {
            console.error(error);
            return next(createError(500, 'Database error'));
        }
        res.render('sum', { sum: result.rows });
    });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).send(err.message || 'Server error');
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
