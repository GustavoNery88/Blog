const express = require('express')
const router = express.Router();
const mongoose = require('mongoose')
const multer = require('multer')
const fs = require('fs');
const path = require('path');

const { eAdmin } = require("../helpers/eAdmin")

//Arquivos Models
const { categorias } = require("../models/Categoria")
const { postagens } = require("../models/Postagem")

// Configuração de armazenamento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now()+'-'+file.originalname)
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/gif'
        ];
    } 
});
const upload = multer({storage: storage});

router.get('/postagens', eAdmin, (req,res) =>{
    postagens.find().populate("categoria").sort({date:"desc"}).lean().then((postagens) =>{
        res.render('admin/postagens', { postagens: postagens })
    })
})

router.get('/postagem/add', eAdmin, (req,res) =>{
    categorias.find().lean().then((categorias) =>{
        res.render('admin/addpostagem', {categorias: categorias})
    })
})

router.post('/postagem/nova', upload.single('img'), eAdmin, (req,res) =>{
    const novaPostagem = new postagens({
        titulo: req.body.titulo,
        slug: req.body.titulo.toLowerCase().split(" ").join("-"),
        descricao: req.body.descricao,
        conteudo: req.body.conteudo,
        categoria: req.body.categoria,
        imagem: req.file.filename.toLowerCase().split(" ").join("-")
    })
    novaPostagem.save();
    req.flash("success_msg", "Postagem realizada com sucesso")
   res.redirect('/admin/postagens')
})

router.get('/postagem/edit/:id', eAdmin, (req,res) =>{
    postagens.findOne({_id:req.params.id}).lean().then((postagens) =>{
        res.render('admin/editpostagem', {postagens: postagens})
    })
})

router.post('/postagem/edit', eAdmin, (req,res) =>{
    let filter = { _id: req.body.id }
    let update = { titulo: req.body.titulo, descricao: req.body.descricao }
    postagens.findOneAndUpdate(filter, update).then(() => {
        req.flash("success_msg", "Postagem atualizada")
        res.redirect('/admin/postagens')
    }).catch(err => {
        req.flash("error_msg", "Erro ao atualizar categoria")
    })
})

router.get('/postagem/apagar/:id', eAdmin, (req, res) => {
    postagens.findOneAndDelete({
        _id: req.params.id
    }).then((postagem) => {
        // Remover a imagem associada ao post excluído
        if (postagem && postagem.imagem) {
            const imagePath = path.join(__dirname, '../uploads', postagem.imagem);
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Erro ao excluir a imagem:', err);
                } else {
                    console.log('Imagem excluída com sucesso!');
                }
            });
        }

        req.flash("success_msg", "Postagem apagada com sucesso");
        res.redirect('/admin/postagens');
    }).catch(() => {
        req.flash("error_msg", "Erro ao apagar postagem");
        res.redirect('/admin/postagens');
    });
});

module.exports = router;