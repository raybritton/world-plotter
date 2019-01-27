require('dotenv').config();

const sqlite = require('sqlite3');
const util = require('util');
const sprintf = require('sprintf-js').sprintf;
const express = require('express');
const bodyParser = require('body-parser');
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
app.use(bodyParser.json());

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
            res.status(500).send(err || {error: true});
        } else if (row == undefined) {
            res.status(404).send("{}");
        } else {
            row.id = parseInt(row.id);
            res.send(row);
        }
    });
});

app.get("/mapping/:id", (req, res) => {
    var id = parseInt(req.params.id);

    db.get("SELECT * FROM points WHERE id = ?", [id], (err, row) => {
        if (err) {
            console.log(err);
            res.status(500).send(err || {error: true});
        } else if (row == undefined) {
            res.status(404).send("{}");
        } else {
            row.id = parseInt(row.id);
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
            res.status(500).send(err || {error: true});
        } else {
            db.get("SELECT * FROM points WHERE rowid == ?", [row.rowid + direction], (err, row) => {
                if (err) {
                    console.log(err);
                    res.status(500).send(err || {error: true});
                } else if (row == undefined) {
                    res.status(404).send("{}");
                } else {
                    row.id = parseInt(row.id);
                    res.send(row);
                }
            });
        }
    })
});

app.put("/mapping", (req, res) => {
    db.run("UPDATE points SET x = ?, y = ? WHERE lat = ? AND lng = ?", 
            [req.body.x, req.body.y, req.body.lat, req.body.lng], (err) => {
            if (err) {
                console.log(err);
                res.status(500).send({error: true});
            } else {
                res.status(200).send({});
            }
        })
});

app.post("/mapping", (req, res) => {
    if (req.body.lat === undefined) {
        res.status(500).send({error: true});
        return;
    }
    db.get("SELECT x,y FROM points WHERE lat = ? AND lng = ? AND x IS NOT NULL LIMIT 1", [
        req.body.lat, req.body.lng], (err, row) => {
            if (err) {
                console.log(err);
                res.status(500).send({error: true});
            }
            row = (row || {})
            var x = row.x;
            var y = row.y;
            var found = (row.x) ? true : false;
            db.run("INSERT INTO points (id, lat, lng, x, y, date, count, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
                req.body.id, req.body.lat, req.body.lng, x, y, req.body.date, req.body.count, req.body.category], (err) => {
                    if (err) {
                        console.log(err);
                        res.status(500).send({error: true});
                    } else {
                        res.status(200).send({alreadySet: found});
                    }
                });
        });
});

app.get("/stats", (req, res) => {
    var sql = "SELECT COUNT(id) AS total, SUM(x is NOT NULL) as completed, SUM(category == 'Drowning') as drowned, SUM(category == 'Fall') as fall, SUM(category == 'Murdered') as murdered, SUM(category == 'Exposure') as exposure, SUM(category == 'Vehicle Accident') as accident, SUM(category == 'Unknown') as unknown, SUM(category == 'Multiple') as multiple, SUM(category == 'Sickness') as sickness, SUM(category == 'Rape') as rape, SUM(category == 'Asphyxiation') as asphyxiation, SUM(category == 'War') as war, SUM(category == 'Other') as other, SUM(category == 'Burned') as burned, SUM(count) as peopleTotal FROM points"

    db.get(sql, (err, row) => {
        if (err) {
            console.log(err);
            res.status(500).send({error: true});
        } else {
            res.status(200).send(row);
        }
    });
});

app.get("/json", (req, res) => {
    db.all("SELECT * FROM points WHERE x IS NOT NULL", (err, rows) => {
        if (err) {
            console.log(err);
            res.status(500).send({error: true});
        } else {
            res.status(200).send(rows);
        }
    });
});

app.use(function(err, req, res, next) {
    if (res.headersSent) {
        return next(err)
    }
	res.status(err.status || 500).send({'error': util.inspect(err)});
});

app.listen(SERVER_PORT, SERVER_HOST);

console.log(sprintf('World plotter started at %s listening on %s:%s', new Date().toISOString(), SERVER_HOST, SERVER_PORT));