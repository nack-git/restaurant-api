require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");

const app = express();

// ==================================
// MIDDLEWARE
// ==================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ==================================
// DATABASE (POSTGRESQL)
// ==================================

const db = new Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: {
        rejectUnauthorized: false
    }
});

// ==================================
// STATIC FILES
// ==================================

app.use(
    express.static(path.join(__dirname, "public"))
);

// ==================================
// HEALTH CHECK
// ==================================

app.get("/health", (req, res) => {
    res.send("OK");
});

app.use("/image", express.static("image"));

// ==================================
// GET MENUS
// ==================================

app.get("/menus", async (req, res) => {
    try {

        const result = await db.query(
            `SELECT * FROM menus
             WHERE is_available = true
             ORDER BY id DESC`
        );

        res.json(result.rows);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Fetch Error"
        });
    }
});

// ==================================
// ADD MENU
// ==================================

app.post("/menu", async (req, res) => {
    try {

        const {
            name,
            category,
            price,
            image
        } = req.body;

        if (!name || !price) {

            return res.status(400).json({
                message: "Name And Price Required"
            });
        }

        const result = await db.query(
            `
            INSERT INTO menus (
                name,
                category,
                price,
                image
            )
            VALUES ($1, $2, $3, $4)
            RETURNING id
            `,
            [
                name,
                category || null,
                price,
                image || null
            ]
        );

        res.json({
            message: "Add Success",
            id: result.rows[0].id
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Insert Error"
        });
    }
});

// ==================================
// DELETE MENU
// ==================================

app.delete("/menu/:id", async (req, res) => {
    try {

        await db.query(
            `DELETE FROM menus
             WHERE id = $1`,
            [req.params.id]
        );

        res.json({
            message: "Delete Success"
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Delete Error"
        });
    }
});

// ==================================
// SERVER
// ==================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`
==================================
SERVER RUNNING
PORT: ${PORT}
==================================
    `);

});