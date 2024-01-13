const express = require('express')
const router = express.Router();
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
        cb(null, Date.now() + '-' + file.originalname)
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/jpg'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true); // Aceita o arquivo
        } else {
            cb(new Error('Tipo de arquivo não suportado.'), false); // Rejeita o arquivo
        }
    }


});
const upload = multer({ storage: storage });

router.get('/postagens', eAdmin, (req, res) => {
    postagens.find().populate("categoria").sort({ date: "desc" }).lean().then((postagens) => {
        res.render('admin/postagens', { postagens: postagens })
    })
})

router.get('/postagem/add', eAdmin, (req, res) => {
    categorias.find().lean().then((categorias) => {
        res.render('admin/addpostagem', { categorias: categorias })
    })
})

router.post('/postagem/nova', upload.single('img'), eAdmin, (req, res) => {
    const novaPostagem = new postagens({
        titulo: req.body.titulo,
        slug: req.body.titulo.toLowerCase().split(" ").join("-"),
        descricao: req.body.descricao,
        conteudo: req.body.conteudo,
        categoria: req.body.categoria,
        imagem: req.file.filename.toLowerCase().split(" ").join("-")
    })
    novaPostagem.save();
    req.flash('success', 'Postagem adicionada com sucesso!');
    res.redirect('/admin/postagens')
})

router.get('/postagem/edit/:id', eAdmin, (req, res) => {
    postagens.findOne({ _id: req.params.id }).lean().then((postagens) => {
        res.render('admin/editpostagem', { postagens: postagens })
    })
})

router.post('/postagem/edit', eAdmin, async (req, res) => {
    try {
        let filter = { _id: req.body.id };
        let update = { titulo: req.body.titulo, descricao: req.body.descricao, conteudo: req.body.conteudo };
        await postagens.findOneAndUpdate(filter, update);
        req.flash('success', 'Postagem editada com sucesso!');
        res.redirect('/admin/postagens');
    } catch (err) {
        req.flash('error', 'Erro ao editar postagem.');
        res.redirect('/admin/postagem/edit/' + req.body.id);
    }
});

router.post('/postagem/apagar/:id', eAdmin, async (req, res) => {
    try {
        const postagemToDelete = await postagens.findOne({ _id: req.params.id });

        if (!postagemToDelete) {
            req.flash('error', 'Postagem não encontrada!');
            return res.redirect('/admin/postagens');
        }

        // Obtém o nome do arquivo da imagem associada à postagem
        const imagemFileName = postagemToDelete.imagem;

        // Exclui a postagem do banco de dados
        const deletedPostagem = await postagens.findOneAndDelete({ _id: req.params.id });

        if (!deletedPostagem) {
            req.flash('error', 'Erro ao apagar postagem!');
        } else {
            const imagePath = path.join(__dirname, '..', 'uploads', imagemFileName);

            // Exclui o arquivo de imagem do sistema de arquivos
            fs.unlinkSync(imagePath);

            req.flash('success', 'Postagem apagada com sucesso!');
        }

        res.redirect('/admin/postagens');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Erro ao apagar postagem');
        res.redirect('/admin/postagens');
    }
});


module.exports = router;