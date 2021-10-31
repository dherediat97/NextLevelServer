var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    methodOverride = require("method-override"),
    http = require("http"),
    https = require("https"),
    request = require('request'),
    crypto = require('crypto'),
    util = require('./util/time/time.js'),
    urls = require('./util/urls.js'),
    colors = require('colors/safe');
var sessionID = {
    "value": ""
}
var sessionID
app.use(bodyParser.urlencoded({
    extended: false
}));
var port = process.env.PORT || 8081;
app.use(bodyParser.json());
app.use(methodOverride());
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    next();
});

var router = express.Router();

router.get('/', function(req, res) {});


function createSignature(url) {
    var data = urls.hirezAPIKEY + url + urls.hirezAUTHKEY + util.getDateTimeHiRez();
    var signature = crypto.createHash('md5').update(data).digest("hex").toLowerCase();
    console.log("signature = " + signature)
    return signature;
}

function initSessionHIREZ(gameType) {
    var session_ID = "";
     if(gameType == 0){
        var signature = createSignature("createsession");
        var urlCreateSession = urls.urlBasePaladins + 'createsessionjson/'
         + urls.hirezAPIKEY + '/' + signature + '/' + util.getDateTimeHiRez();
        var options = {
            url: urlCreateSession,
            headers: {
                'Content-Type': 'application/json;charseft=utf-8'
            }
        };
        request(options,  function(error, response, body){
            var datosJSON = JSON.parse(body);
            if (datosJSON.session_id != null || datosJSON.session_id != "" || datosJSON.ret_msg == "Approved") {
                session_ID = datosJSON.session_id;
                sessionID = session_ID;
            }
        });
    }else{
        var signature = createSignature('createsession');
        var urlCreateSession = urls.urlBaseSmite + 'createsessionjson/'
         + urls.hirezAPIKEY + '/' + signature + '/' + util.getDateTimeHiRez();
        var options = {
            url: urlCreateSession,
            headers: {
                'Content-Type': 'application/json;charseft=utf-8'
            }
        };
        request(options,  function(error, response, body){
            var datosJSON = JSON.parse(body);
            if (datosJSON.session_id != null || datosJSON.session_id != "" || datosJSON.ret_msg == "Approved") {
                session_ID = datosJSON.session_id;
                sessionID = session_ID;
            }
        });
    }
}


router.get('/lol/obtenerCampeones', function(req, res) {
    var url = 'https://ddragon.leagueoflegends.com/cdn/' + version.dd + '/data/es_ES/champion.json';
    var options = {
        url: url,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    request(options, function(error, response, body) {
        var campeonesArr = JSON.parse(body);
        campeonesArr.version = version.dd;
        res.contentType('application/json');
        res.send(JSON.stringify(campeonesArr));
    });

});
router.get('/lol/obtenerCampeon/:nombreCampeon', function(req, res) {
    var nombreCampeon = req.params.nombreCampeon;
    var url = 'https://ddragon.leagueoflegends.com/cdn/' + version.dd + '/data/es_ES/champion/' + nombreCampeon + '.json';
    var options = {
        url: url,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    request(options, function(error, response, body) {
        var campeones = JSON.parse(body);
        var campeonesArrAux = campeones.data;
        for (const campeon in campeonesArrAux) {
            if (campeon == nombreCampeon) {
                const campeonJSON = campeonesArrAux[campeon];
                res.contentType('application/json');
                res.send(campeonJSON);
            }
        }
    });
});

function obtenerVersion() {
    var versionDDragon = "";
    var url = 'https://ddragon.leagueoflegends.com/realms/na.json';
    var options = {
        url: url,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    request(options, function(error, response, body) {
        version = JSON.parse(body);
        versionDDragon = version.dd;
    })

    return versionDDragon;
}
router.get('/paladins/obtenerCampeon/:idCampeon', function(req, res) {
    initSessionHIREZ(0);
    var idCampeon = req.params.idCampeon;
    if (idCampeon != undefined) {
        getDataHIREZ('getchampion', res, 'json', idCampeon);
    }
});

router.get('/paladins/obtenerSkinCampeon/:idCampeon', function(req, res) {
    initSessionHIREZ(0);
    var idCampeon = req.params.idCampeon;
    if (idCampeon != undefined) {
        getDataHIREZ('getchampionskins', res, 'json', idCampeon);
    }
});

router.get('/paladins/obtenerCampeones', function(req, res) {
    initSessionHIREZ(0);
    getDataHIREZ('getchampions', res, 'json', null);
});

router.get('/smite/obtenerDioses', function(req, res) {
    initSessionHIREZ(1);
    getDataHIREZ('getgods', res, 'json', null);
});
router.get('/smite/obtenerSkinDios/:idDios', function(req, res) {
    initSessionHIREZ(1);
    var idDios = req.params.idDios;
    if (idDios != undefined) {
        getDataHIREZ('getgodskins', res, 'json', idDios);
    }
});
router.get('/smite/obtenerDios/:idDios', function(req, res) {
    initSessionHIREZ(1);
    var idDios = req.params.idDios;
    if (idDios != undefined) {
        getDataHIREZ('getgod', res, 'json', idDios);
    }
});

function getDataHIREZ(signatureString, res, formatDataType, idCampeon) {
    console.log("signatureString = "+signatureString);
    var signature = createSignature(signatureString);
    if (signatureString == "getgods") {
        var url = urls.urlBaseSmite + "getgods" + formatDataType + "/" 
        + urls.hirezAPIKEY + '/' + signature + '/' + sessionID + '/' + 
        util.getDateTimeHiRez() + '/9';
    } else if (signatureString == "getgod") {
        var url = urls.urlBaseSmite + "getgod" + formatDataType + "/" 
        + urls.hirezAPIKEY + '/' + signature + '/' + sessionID + '/' +
         util.getDateTimeHiRez() + '/9';
    } else if (signatureString == "getchampions") {
        var url = urls.urlBasePaladins + "getchampions" + formatDataType + "/" 
        + urls.hirezAPIKEY + '/' + signature + '/' + sessionID + '/' +
         util.getDateTimeHiRez() + '/9';
    } else if (signatureString == "getchampion") {
        var url = urls.urlBasePaladins + "getchampion" + formatDataType + "/" 
        + urls.hirezAPIKEY + '/' + signature + '/' + sessionID + '/' + 
        util.getDateTimeHiRez() + '/9';
    } else if (signatureString == "getchampionskins") {
        var url = urls.urlBasePaladins + "getchampionskins" + formatDataType + "/" 
        + urls.hirezAPIKEY + '/' + signature + '/' + sessionID + '/' + 
        util.getDateTimeHiRez() + "/" + idCampeon + '/9';
    } else if (signatureString == "getgodskins") {
        var url = urls.urlBaseSmite + "signatureString" + formatDataType + "/" 
        + urls.hirezAPIKEY + '/' + signature + '/' + sessionID + '/' + 
        util.getDateTimeHiRez() + "/" + idCampeon + '/9';
    }
    setTimeout(function(){
        console.log("url = "+url)
        console.log("sessionID = "+sessionID)
        request(url, function(error, response, body) {
                console.log("body = "+body)
                console.log("response = "+response)
                if (signatureString == "getgods") {
                    var diosesJSON = { "dioses": JSON.parse(body) };
                    res.send(diosesJSON);
                } else if (signatureString == "getgod") {
                    var dioses = JSON.parse(body);
                    var dios = dioses.filter(item => item.id == idCampeon);
                    var diosJSON = { "dios": dios };
                    res.send(diosJSON);
                } else if (signatureString == "getchampions") {
                    var campeonesJSON = { "campeones": JSON.parse(body) };
                    res.send(campeonesJSON);
                } else if (signatureString == "getchampion") {
                    var campeones = JSON.parse(body);
                    var campeon = campeones.filter(item => item.id == idCampeon);
                    var campeonJSON = { "campeon": campeon };
                    res.send(campeonJSON);
                } else if (signatureString == "getchampionskins") {
                    var skinCampeonJSON = { "skin": JSON.parse(body) };
                    res.send(skinCampeonJSON);
                } else if (signatureString == "getgodskins") {
                    var skindiosJSON = { "skin": JSON.parse(body) };
                    res.send(skindiosJSON);
                }
        });
    },500)
}
app.on("error", function(error) {
    if (error.message.code == 'ETIMEDOUT') {

    }
})
app.use(router);

var version = "";
setTimeout(function() {
    version = obtenerVersion();
        if(version != null)
            console.log(colors.green("LOL API ONLINE"));
    request(urls.urlBasePaladins + 'pingjson', (error,response,body) => {    
        if(error == null)
            console.log(colors.green("HI REZ API ONLINE"));
    });
}, 1000)

app.listen(port, function() {
    console.log(colors.green("API escuchando en http://localhost:" + port));
});