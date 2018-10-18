
module.exports.WebApp = function(bot){
    const directline = require("offline-directline");
    const express = require("express");

    const app = express();
    app.use('/public', express.static(__dirname +'/static'))
    app.use('/node_modules', express.static(__dirname +'/node_modules'))
    directline.initializeRoutes(app, 3000, "http://127.0.0.1:3978/api/messages");

    app.get('/dir', function(req, res){
        try{
            res.send(__dirname)
        } catch (err) {
            res.send('err')
        }
    });

    app.post('/model', function(req, res){
        try{
            bot.buildDialogModel(req.body)
            res.send('succ')
        } catch (err) {
            console.error(`[botInitializationError]: ${ err }`);
            res.send('err')
        }
    });

    // try {
    //     bot.buildDialogModel(require('./bot/simple-bot'));
    // } catch (err) {
    //     console.error(`[botInitializationError]: ${ err }`);
    // }
}

