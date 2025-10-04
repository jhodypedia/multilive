require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const helmet = require('helmet');
const layouts = require('express-ejs-layouts');
const socketio = require('socket.io');

const { sequelize } = require('./config/sequelize');
require('./models/Channel'); require('./models/PlaylistItem');
require('./models/LiveSession'); require('./models/Schedule');

const apiRouter = require('./routes/api');
const { bootScheduler } = require('./scheduler/scheduler');

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors:{origin:process.env.ALLOWED_ORIGIN||'*'} });
app.set('io', io);

app.use(helmet({contentSecurityPolicy:false}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('/public', express.static(path.join(__dirname,'..','public')));
app.use('/uploads', express.static(path.join(__dirname,'..','uploads')));

app.set('views', path.join(__dirname,'views'));
app.set('view engine','ejs');
app.use(layouts); app.set('layout','layout');

app.get('/',(req,res)=> res.render('index',{pageTitle:'YT Multi Loop'}));
app.use('/api', apiRouter);

io.on('connection', s=> s.emit('hello',{msg:'Connected',tz:process.env.TZ}));

(async()=>{
  await sequelize.sync();
  bootScheduler(io);
  server.listen(process.env.PORT, ()=> console.log('Server running on',process.env.PORT));
})();
