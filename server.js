   require('dotenv').config();
   const express = require('express');
   const axios = require('axios');
   const cors = require('cors');

   const app = express();
   const PORT = process.env.PORT || 3000;

   app.use(cors());
   app.use(express.json());

   const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
   const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

   app.post('/auth/github', async (req, res) => {
     const { code } = req.body;
     if (!code) return res.status(400).json({ error: 'Authorization code missing' });

     try {
       const tokenResponse = await axios.post(
         'https://github.com/login/oauth/access_token',
         { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code },
         { headers: { Accept: 'application/json' } }
       );

       const accessToken = tokenResponse.data.access_t

oken;
       const userResponse = await axios.get('https://api.github.com/user', {
         headers: { Authorization: `token ${accessToken}` },
       });

       res.json({ access_token: accessToken, github_username: userResponse.data.login });
     } catch (error) {
       res.status(500).json({ error: 'OAuth flow failed', details: error.message });
     }
   });

   app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
