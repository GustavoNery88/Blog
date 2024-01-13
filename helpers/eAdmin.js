module.exports = {
    eAdmin: function(req,res,next){
        if(req.isAuthenticated() && req.user.eAdmin == 0){
            return next();
        }
        req.flash('success', 'Você precisa ser administrador!');
        res.redirect("/")
    }
}