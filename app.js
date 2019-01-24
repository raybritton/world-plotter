require('dotenv').config();

const sqlite = require('sqlite3');
const util = require('util');
const sprintf = require('sprintf-js').sprintf;
const express = require('express');
const app = express();

global.SERVER_HOST = process.env.HOSTNAME || 'localhost';
global.SERVER_PORT = process.env.PORT || '3001';
global.SQLITE_FILE = process.env.DATABASE_FILE;

const db = new sqlite.Database(SQLITE_FILE, (err) => {
    if (err) {
        console.log('Could not connect to database', err)
    }
})

app.use(express.static('public'));

app.get("/alive", (req, res) => {
    res.sendStatus(200);
});

app.get("/", (req, res) => {
    res.redirect("map.html")
});

app.get("/mapping", (req, res) => {
    db.get("SELECT * FROM points WHERE x IS NULL LIMIT 1", (err, row) => {
        if (err) {
            console.log(err);
            res.status(500).send(err);
        } else if (row == undefined) {
            res.status(404).send("{}");
        } else {
            res.send(row);
        }
    });
});

app.get("/mapping/:id/:direction", (req, res) => {
    var direction = (req.params.direction === "previous") ? -1 : 1;
    var id = parseInt(req.params.id);

    db.get("SELECT rowid FROM points WHERE id == ?", [id], (err, row) => {
        if (err || row == undefined) {
            console.log(err);
            res.status(500).send(err);
        } else {
            db.get("SELECT * FROM points WHERE rowid == ?", [row.rowid + direction], (err, row) => {
                if (err) {
                    console.log(err);
                    res.status(500).send(err);
                } else if (row == undefined) {
                    res.status(404).send("{}");
                } else {
                    res.send(row);
                }
            });
        }
    })
});

app.post("/mapping/:id", (req, res) => {

});

app.use(function(err, req, res, next) {
    if (res.headersSent) {
        return next(err)
    }
	res.status(err.status || 500).send({'error': util.inspect(err)});
});

app.listen(SERVER_PORT, SERVER_HOST);

console.log(sprintf('World plotter started at %s listening on %s:%s', new Date().toISOString(), SERVER_HOST, SERVER_PORT));