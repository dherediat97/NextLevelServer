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

router.get('/', function(req, res) {
  res.send("Bienvenido a la API de <b>NextLevel</b>");
});


function createSignature(metodo) {
  var data = urls.hirezAPIKEY + metodo + urls.hirezAUTHKEY + util.getDateTimeHiRez();
  var signature = crypto.createHash('md5').update(data).digest("hex");
  return signature;
}

function initSessionHIREZ() {
  var session_ID = "";
  var signature = createSignature('createsession');
  var urlCreateSession = urls.urlBasePaladins + 'createsessionjson/' + urls.hirezAPIKEY + '/' + signature + '/' + util.getDateTimeHiRez();
  http.get(urlCreateSession, (resp) => {
    var data = '';

    resp.on('data', (chunk) => {
      data += chunk;
    });


    resp.on('end', () => {
      var datosJSON = JSON.parse(data);
      if (datosJSON.session_id != null || datosJSON.session_id != "" || datosJSON.ret_msg == "Approved")
        session_ID = datosJSON.session_id;
      sessionID.value = session_ID;

    });

  }).on("error", (err) => {
    console.log(err);
  });
}

//TODO Recoger version de la API del LOL antes de obtener los campeones.
//No existe ese metodo, investigar otra manera
var version = "9.20.1";

router.get('/lol/obtenerCampeones', function(req, res) {
  //URL Base campeones LOL
  //https://ddragon.leagueoflegends.com/cdn/9.20.1/data/es_ES/champion.json
  var url = 'https://ddragon.leagueoflegends.com/cdn/'+version+'/data/es_ES/champion.json';
  var options = {
    url: url,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  request(options, function(error, response, body) {
    var campeonesArr = JSON.parse(body);
    res.contentType('application/json');
    res.send(JSON.stringify(campeonesArr));
  });

});
router.get('/lol/obtenerCampeon/:nombreCampeon', function(req, res) {
  //URL Base campeones LOL
  //https://ddragon.leagueoflegends.com/cdn/9.20.1/data/es_ES/champion.json
  var nombreCampeon = req.params.nombreCampeon;
  var url = 'https://ddragon.leagueoflegends.com/cdn/'+version+'/data/es_ES/champion/'+nombreCampeon+'.json';
  var options = {
    url: url,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  request(options, function(error, response, body) {
    var campeones = JSON.parse(body);
    
    //console.log(nombreCampeon)
    var campeonesArrAux = campeones.data;
    //console.log(campeonesArrAux)
    for (const campeon in campeonesArrAux) {
      if (campeon == nombreCampeon) {
        const campeonJSON = campeonesArrAux[campeon];
        //console.log(campeonJSON)
        res.contentType('application/json');
        res.send(campeonJSON);
        
      }
    }
    
    
  });

});
router.get('/paladins/obtenerCampeon/:idCampeon', function(req, res) {
  initSessionHIREZ();
  var idCampeon = req.params.idCampeon;
  
  if(idCampeon != undefined){
    getDataHIREZ(sessionID,'getchampion',res,'json',idCampeon);
  }
});

router.get('/paladins/obtenerSkinCampeon/:idCampeon', function(req, res) {
  initSessionHIREZ();
  var idCampeon = req.params.idCampeon;
  if(idCampeon != undefined){
    getDataHIREZ(sessionID,'getchampionskins',res,'json',idCampeon);
  }
});

router.get('/paladins/obtenerCampeones', function(req, res) {
  initSessionHIREZ();
  getDataHIREZ(sessionID,'getchampions',res,'json',null);
});

router.get('/smite/obtenerDioses', function(req, res) {
  initSessionHIREZ();
  getDataHIREZ(sessionID,'getgods',res,'json',null);
});

router.get('/smite/obtenerDios/:idDios', function(req, res) {
  initSessionHIREZ();
  var idDios = req.params.idDios;
  if(idDios != undefined){
    getDataHIREZ(sessionID,'getgod',res,'json',idDios);
  }
});
function getDataHIREZ(sessionID,signatureString,res, formatDataType,idCampeon){
  setTimeout(function(){
    var signature = createSignature(signatureString);

    if(signatureString == "getgods"){
      var url = urls.urlBaseSmite + signatureString+formatDataType + "/"+urls.hirezAPIKEY + '/' + signature + '/' + sessionID.value + '/' + util.getDateTimeHiRez() + '/9';
    }else if(signatureString == "getgod"){
      var signature = createSignature("getgods");
      var url = urls.urlBaseSmite + "getgods"+formatDataType + "/"+urls.hirezAPIKEY + '/' + signature + '/' + sessionID.value + '/' + util.getDateTimeHiRez() + '/9';
    }else if(signatureString == "getchampions"){
      var url = urls.urlBasePaladins + signatureString+formatDataType + "/"+urls.hirezAPIKEY + '/' + signature + '/' + sessionID.value + '/' + util.getDateTimeHiRez() + '/9';
    }else if(signatureString == "getchampion"){
      var signature = createSignature("getchampions");
      var url = urls.urlBasePaladins + "getchampions"+formatDataType +"/"+ urls.hirezAPIKEY + '/' + signature + '/' + sessionID.value + '/' + util.getDateTimeHiRez() + '/9';
    }else if(signatureString == "getchampionskins"){
      var url = urls.urlBasePaladins + signatureString+formatDataType +"/"+ urls.hirezAPIKEY + '/' + signature + '/' + sessionID.value + '/' + util.getDateTimeHiRez() +"/" + idCampeon+ '/9';
    }
    var options = {
      url: url,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    request(options, function(error, response, body) {
      if(signatureString == "getgods"){
        var diosesJSON = {"dioses":JSON.parse(body)};
        res.send(diosesJSON);
      }else if(signatureString == "getgod"){
        var dioses = JSON.parse(body);
        var dios = dioses.filter(item => item.id == idCampeon);
        var diosJSON = {"dios":dios};
        res.send(diosJSON);
      }else if(signatureString == "getchampions"){
        var campeonesJSON = {"campeones":JSON.parse(body)};
        res.send(campeonesJSON);
      }else if(signatureString == "getchampion"){
        var campeones = JSON.parse(body);
        var campeon = campeones.filter(item => item.id == idCampeon);
        var campeonJSON = {"campeon":campeon};
        res.send(campeonJSON);
      }else if(signatureString == "getchampionskins"){
        var skinCampeonJSON = {"skin":JSON.parse(body)};
        res.send(skinCampeonJSON);
      }
    });
  },1000)
}

app.use(router);

app.listen(port, function() {
  console.log(colors.green("API escuchando en http://localhost:"+port));
});
