const express = require('express');
const router = express.Router();

const { eAdmin } = require("../helpers/eAdmin")

//Arquivos Models
const { categorias } = require("../models/Categoria")

// Rotas Categorias
router.get('/categorias', eAdmin, (req, res) => {
    categorias.find().lean().then((categorias) => {
        res.render('admin/categorias', { categorias: categorias })
    })
})

router.get('/categorias/add', eAdmin, (req, res) => {
    res.render('admin/addcategoria');
});

router.post('/categoria/nova', eAdmin, (req, res) => {
    const novaCategoria = new categorias({
        nome: req.body.nome,
        slug: req.body.slug
    })
    novaCategoria.save();
    req.flash('success', 'Categoria adicionada com sucesso!');
    res.redirect('/admin/categorias')
})

router.get('/categorias/edit/:id', eAdmin, (req,res) =>{
    categorias.findOne({_id:req.params.id}).lean().then((categorias) =>{
        res.render('admin/editcategoria', {categorias: categorias})
    })     
})

router.post('/categoria/edit', eAdmin, async (req, res) => {
    try {
        let filter = { _id: req.body.id };
        let update = { nome: req.body.nome, slug: req.body.slug};
        await categorias.findOneAndUpdate(filter, update);
        req.flash('success', 'Categoria editada com sucesso!');
        res.redirect('/admin/categorias');
    } catch (err) {
        req.flash('error', 'Erro ao editar categoria.');
        res.redirect('/admin/categoria/edit/' + req.body.id);
    }
});

router.post('/categoria/apagar/:id', eAdmin, async (req, res) => {
    try {
        const deletedUser = await categorias.findOneAndDelete({ _id: req.params.id });
        if (!deletedUser) {
            req.flash('error', 'Categoria não encontrado!');
        } else {
            req.flash('success', 'Categoria apagado com sucesso!');
        }
        res.redirect('/admin/categorias');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Erro ao apagar categoria!');
        res.redirect('/admin/categorias');
    }
});


module.exports = router;
