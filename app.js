const express = require('express');
const app = express();
const flash = require('express-flash');
const session = require('express-session');
const exphbs = require('express-handlebars');
const handlebars = exphbs.create({});
const mongoose = require('mongoose');
const path = require('path');
const passport = require("passport");
const moment = require("moment");
const MemoryStore = require('memorystore')(session); // Adicionado

// Models
const { postagens } = require("./models/Postagem")

// Passport de autenticacao
require("./config/auth")(passport)

// ENV com dados do Mongo
require('dotenv').config();

// Rotas
const postagem = require('./routes/postagem');
const usuario = require('./routes/usuario');
const categoria = require('./routes/categoria');

// Encoded
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessao
app.use(session({
    secret: "blog-em-node-js",
    resave: true,
    saveUninitialized: true,
    store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    })
}))

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

// Template Engine
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// Public Functions
app.use(express.static(path.join(__dirname, 'public')));

// Diretorio das Imagens
const imagemPath = path.join(__dirname, 'uploads');
app.use("/uploads", express.static(imagemPath));

// Rotas
app.use('/admin', postagem)
app.use('/admin', usuario)
app.use('/admin', categoria)


// Conecation MongoDB
const Schema = mongoose.Schema;
mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log('Mongo conectado')
    }).catch((err) => {
        console.log('Erro ao conectar ao Mongo online', err)
    });

// Porta de acesso
const PORT = process.env.PORT

// Home page
app.get('/', (req, res) => {
    postagens.find().populate("categoria").sort({ date: "desc" })
        .lean().then((postagens) => {
            res.render('usuario/home', { postagens: postagens })
        }).catch((err) => {
            res.redirect("/404")
        })
});

app.get('/:id', (req, res) => {
    postagens.findOne({ slug: req.params.id }).lean().then((postagens) => {
        res.render('usuario/ler', { postagens: postagens })
    }).catch((err) => {
        res.redirect("/404")
    })
});

app.get("/404", (req, res) => {
    res.send('Erro 404')
})

app.listen(PORT, () => {
    console.log('Escutando na porta: ' + PORT)
})
