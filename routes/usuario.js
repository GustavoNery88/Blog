const express = require('express')
const router = express.Router();
const bcrypt = require('bcryptjs')

const { eAdmin } = require("../helpers/eAdmin")

//Arquivos Models
const { usuarios } = require("../models/Usuario");
const passport = require('passport');


// Rotas 
router.get('/usuarios', eAdmin, (req, res) => {
    usuarios.find().lean().then((usuarios) => {
        res.render('admin/usuarios', { usuarios: usuarios })
    })
})

router.get('/usuario/add', eAdmin, (req, res) => {
    res.render('admin/addusuario')
})


router.post('/usuario/novo', eAdmin, async (req, res) => {
    try {
        const { email } = req.body;
        const adminJaExistente = await usuarios.findOne({ email: email });

        if (adminJaExistente) {
            req.flash('error', 'Este e-mail já está cadastrado!');
            return res.redirect('/admin/usuario/add');
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(req.body.senha, salt);

        const novoAdmin = new usuarios({
            nome: req.body.nome,
            email: req.body.email,
            senha: hash,
        });

        await novoAdmin.save();
        req.flash('success', 'Admin cadastrado com sucesso!');
        res.redirect('/admin/usuarios');

    } catch (err) {
        console.error(err);
        req.flash('error', 'Erro ao cadastrar admin.');
        res.redirect('/admin/usuario/add');
    }
});


router.get('/usuario/edit/:id', eAdmin, (req, res) => {
    usuarios.findOne({ _id: req.params.id }).lean().then((usuarios) => {
        res.render('admin/editusuario', { usuarios: usuarios })
    })
})


router.post('/usuario/edit', eAdmin, async (req, res) => {
    try {
        const existingUser = await usuarios.findOne({ email: req.body.email, _id: { $ne: req.body.id } });

        if (existingUser) {
            req.flash('error', 'Este e-mail já está cadastrado para outro usuário!');
            return res.redirect('/admin/usuario/edit/' + req.body.id);
        }

        let filter = { _id: req.body.id };
        let update = { nome: req.body.nome, email: req.body.email };
        await usuarios.findOneAndUpdate(filter, update);
        req.flash("success", "Usuário atualizado com sucesso!")
        res.redirect('/admin/usuarios');
    } catch (err) {
        res.redirect('/admin/usuario/edit/' + req.body.id);
        req.flash("error", "Erro ao atualizar usuário!")
    }
});

router.post('/usuario/apagar/:id', eAdmin, async (req, res) => {
    try {
        const deletedUser = await usuarios.findOneAndDelete({ _id: req.params.id });
        if (!deletedUser) {
            req.flash('error', 'Usuário não encontrado!');
        } else {
            req.flash('success', 'Usuário apagado com sucesso!');
        }
        res.redirect('/admin/usuarios');
    } catch (error) {
        req.flash('error', 'Erro ao apagar o usuário!');
        res.redirect('/admin/usuarios');
    }
});


router.get('/login', (req, res) => {
    res.render('usuario/login')
})

router.post('/login', (req, res, next) => {
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "login",
        failureFlash: true,
    })(req, res, next)
})


router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        req.flash('success', 'Saiu!');
        res.redirect("/")
    })
})

module.exports = router;