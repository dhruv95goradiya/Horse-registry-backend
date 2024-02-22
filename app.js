import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getAccounts, getContactDetails } from "./plugins/wild-apricot-plugin.js";

//global config
import config from './config/config.js';

//routes
import membersRouter from './routes/members.js';
import horsesRouter from './routes/horses.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import webhookRouter from './routes/webhook.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Set up a route to serve static files
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Connect to MongoDB (replace 'your_database_uri' with your MongoDB URI)
mongoose.connect(config.mongoURI).then(() => console.log("Connected to MongoDB!"))
.catch(err => console.error("Connection error:", err));

// Include routes
app.use('/api/members', membersRouter);
app.use('/api/horses', horsesRouter);
app.use('/api/auth', authRouter); 
app.use('/api/admin', adminRouter);

app.use('/api/webhook', webhookRouter);

app.get('/test', async (req,res)=>{
  let accountInfo = await getAccounts();
  let accountId = accountInfo[0].Id;
  let contactDetails = await getContactDetails(accountId, 72529402)
  res.status(200).json({contactDetails:contactDetails})
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
