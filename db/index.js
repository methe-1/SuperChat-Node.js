const { JsonDB, Config } = require('node-json-db');


// configure and create database
// const db = new JsonDB(new Config("db/superChat", true, true, '.'));


LocalStorage = require('node-localstorage').LocalStorage;
db = new LocalStorage('./db/superChat');

db.setItem('actives', 0);
db.setItem('users', JSON.stringify([]));

module.exports = {
    db,
    ACTIVES: 'actives',
    USERS: 'users'
};
  