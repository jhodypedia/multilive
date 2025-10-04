process.env.TZ = process.env.TZ || 'Asia/Jakarta';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const layouts = require('express-ejs-layouts');
const http = require('http');
const socketio = require('socket.io');
const dotenv = require('dotenv'); dotenv.config();

const { sequelize } = require('./config/sequelize');
const Channel = require('./models/Channel');
const PlaylistItem = require('./models/PlaylistItem');
const LiveSession = require('./models/LiveSession');
const Schedule = require('./models/Schedule');

const apiRouter = require('./routes/api');
const { bootScheduler } = require('./scheduler/scheduler');

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: process.env.ALLOWED_ORIGIN || '*' } });
app.set('io', io);

app.use(helmet({ contentSecurityPolicy:false }));
app.use(express.json());
app.use(express.urlencoded({ extended:true }));

app.use('/public', express.static(path.join(__dirname, '..', 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(layouts);
app.set('layout', 'layout');

app.get('/', (req,res)=> res.render('index', { pageTitle:'YT Multi Loop (WIB)' }));
app.use('/api', apiRouter);

io.on('connection', (socket)=>{
  socket.emit('hello', { msg: 'Realtime connected', tz: process.env.TZ });
});

const PORT = process.env.PORT || 3000;
(async ()=>{
  await sequelize.sync();
  bootScheduler(io);
  server.listen(PORT, ()=> console.log(`Server http://localhost:${PORT} TZ=${process.env.TZ}`));
})();
