// index.js - Copy this exact code
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  // Handle verification challenge
  if (req.body.type === 'url_verification') {
    return res.json({ challenge: req.body.challenge });
  }
  
  // Forward to Make.com
  axios.post('https://hook.us2.make.com/ksycdm5ek8ae3rrykmplztv9zsrr6hsq', req.body)
    .then(() => res.json({ success: true }))
    .catch(() => res.json({ success: true }));
});

app.listen(process.env.PORT || 3000);