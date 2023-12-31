const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const postgresPool = new Pool({
    host: 'localhost',
    database: process.env.POSTGRES_DB,

    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432
});

const AccountsModel = require('../../mongo_models/user/accounts');

router.get('/profile', async (req, res) => {
  const username = req.query.username;

  try {
    // Fetch userdata from PostgreSQL
    const client = await postgresPool.connect();
    const query = 'SELECT * FROM "user"."public_accounts_info" WHERE username = $1';
    const { rows } = await client.query(query, [username]);

    let resultData = {};
    if (rows.length === 0) {
      client.release();
      res.status(404).json({ message: 'NOT FOUND' });
      return;
    }
    resultData = rows[0];
    client.release();

    let accountData = await AccountsModel.findOne(
      { id: resultData.id }
    );

    if (accountData && accountData.birthday){
      resultData.birthday = accountData.birthday;
    } else {
      resultData.birthday = "";
    }

    if (accountData) {
      resultData.description = accountData.description;
      resultData.externalLinks = accountData.external_links;
    } else {
      resultData.description = "";
      resultData.externalLinks = [];
    }

    res.status(404).json({ message: 'SUCCESS', data: resultData });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
