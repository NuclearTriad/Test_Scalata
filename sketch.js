var watchID,

    id = 3,

    latitude,
    longitude,
    accuracy,
    heading,

    numeroAgg = -1,
    metriTOT = 0,
    metriPrec = 0,
    veli = 0,
    tempo = 0,
    backUpPositionLat = [],
    backUpPositionLon = [],
    backUpPositionDist = [],

    stabilizzato = false, //inizia con la propriteà non stabilizzata
    backUpstabilizzation = [], //crea la array dei valori per stabilizzare
    stabilizzationTOT = 0,
    accuracyLimit = 0.4,
    maxStabilizzationArray = 4, //massimo numero di valori che l'array di sopra può tenere (maggiore è più preciso è)

    conv=0, //conversione da m in pixel di scalata

    img,
    imgMask,
    imgLink = [],

    position,
    geoLoc;

function preload() {
  myData = loadJSON("heights.json")
  //img = loadImage('assets/infoPoint.png');
}

function setup() {
    createCanvas(windowWidth, windowHeight);


     for (var i=0; i < myData.landmarks_en.length; i++) {
       imgLink.push("assets/"+myData.landmarks_en[i].img);
       imgLink[i] = loadImage(imgLink[i]);
       }


       mask = createGraphics(720, 1280); //crea il segnaposto per la mascherma sotto (le grandezze qui si ripetono poi sotto)
       imgClone  = createGraphics(720, 1280);
    getLocationUpdate();

  }


function draw() {
    tempo ++

    textAlign(CENTER);
    textSize(20);

    if (stabilizzato==false) {background("red");}
    else {
        background("white");

        mask.rect(0, 1280-conv, 720, 1280); //crea maschera da rettangolo

        push()
          imageMode(CENTER)
          image(imgClone, width/2, height/2,720*(height/1280),height);
        pop()
    }

    text('latitude: ' + latitude, width / 2, 30);
    text('longitude: ' + longitude, width / 2, 30 * 2);
    text('accuracy: ' + accuracy, width / 2, 30 * 3);
    text('heading: ' + heading, width / 2, 30 * 4);

    text('Aggiornamenti: ' + numeroAgg, width / 2, 30 * 6);
    text('Distanza Totale: ' + metriTOT, width / 2, 30 * 7);
    text('Distanza Precedente: ' + metriPrec, width / 2, 30 * 8);
    text('Tempo Trascorso: ' + Math.round((tempo/60)), width / 2, 30 * 9);

    text('Edificio Selezionato: ' + myData.landmarks_en[id].name, width / 4.5, 30 * 15, width*0.6);


}

function stabilizzation() {
  if (stabilizzato==false) { //Stabilizzazione
    if (isNaN(accuracy)==false) {backUpstabilizzation.push(accuracy);} //se la distanza è un valore numerico mettila nell Array della stabilizzazione
    if (backUpstabilizzation.length>maxStabilizzationArray) {backUpstabilizzation.shift()}
    if ((backUpstabilizzation.length==4)&&(stabilizzationTOT<accuracyLimit)) {stabilizzato=true; console.log("stabilizzato");}; //se la sommatoria delle

    stabilizzationTOT = (backUpstabilizzation.sum()/backUpstabilizzation.length)-accuracy;
  }
}

// Funzioni per chiamare getLocationUpdate() (funziona anche senza chiamere )

  function showLocation(position) {
    latitude = position.coords.latitude; //prendi la latitudine dell'utente
    longitude = position.coords.longitude; //prendi la longitudine dell'utente
    accuracy = position.coords.accuracy; //prendi l'accuratezza della precisione dell'utente
    heading = position.coords.heading; //prendi la direzione rispetto al nord dell'utente

    numeroAgg++

    backUpPositionLat.push(latitude); //aggiungi la latitudine alla Array di backup delle latitudini
    backUpPositionLon.push(longitude); //aggiungi la longitudine alla Array di backup delle longitudini

    metriPrec = measure(backUpPositionLat[numeroAgg],backUpPositionLon[numeroAgg],backUpPositionLat[numeroAgg-1],backUpPositionLon[numeroAgg-1]) //calcola la distanza tra la posizione precedente è quella attuale
    metriPrec = Math.round(metriPrec*100)/100 //arrotonda la distanza precedente

    stabilizzation() //Stabilizzazione

   if ((stabilizzato==true)&&(metriTOT<myData.landmarks_en[id].height)&&(metriPrec>accuracyLimit)) {

      if (isNaN(metriPrec)==false) {backUpPositionDist.push(metriPrec);} //se gli aggiornamenti hanno raggiunto la quota di 15. inizia ad aggiungere le distanze percorse alla Array di tutte le distanze
      metriTOT = backUpPositionDist.sum(); //fai la sommatoria della Array di tutte le distanze percorse per sapere la distanza totale percorsa

      conv = map(metriTOT, 0, myData.landmarks_en[id].height, 0, myData.landmarks_en[id].hPx); //converte la distanza in m in pixel di scalata
      mask.clear();

      ( imgClone = imgLink[id].get() ).mask( mask.get() ); //imposta la maschera appena creata al immagine imgClone


   }
  }

  function errorHandler(err) {
    if (err.code == 1) {
      alert("Error: Access is denied!");
     }

    else if ( err.code == 2) {
      alert("Error: Position is unavailable!");
    }

    else if ( err.code == 3) {
      alert("Error: Timeout");
    }

    else if ( err.code == 0) {
      alert("Error: an unkown error occurred");
    }
  }

  function getLocationUpdate(){
    if(navigator.geolocation){
     // timeout at 60000 milliseconds (60 seconds)
    var options = {
     timeout:60000,
     maximumAge:10000,
     enableHighAccuracy: true};

     geoLoc = navigator.geolocation;
     watchID = geoLoc.watchPosition(showLocation, errorHandler, options);
    }

    else{
      alert("Sorry, browser does not support geolocation!");
     }


    }

    function stopWatch(){
     geoLoc.clearWatch(watchID);
    }

    function measure(lat1, lon1, lat2, lon2) {  // generally used geo measurement function
      var R = 6378.137; // Radius of earth in KM
      var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
      var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      var d = R * c;
      return d * 1000; // meters
    }

    Array.prototype.sum = function() {
		    var total = 0;
		    for(var i = 0; i < this.length; i += 1) {total += this[i];}
		    return total;
	  };



    function keyTyped() {

      if (key== "s") {edificoDx()}

      else if (key== "a") {edificoSx()}
    }

    function mouseClicked() {
      if (mouseX>(0.85*width)) {edificoDx(), backUpPositionDist=0;}
      if (mouseX<(0.15*width)) {edificoSx(), backUpPositionDist=0;}
    }

function edificoDx() {
  id++;
  if (id>imgLink.length-1) {id = 0};
  console.log(id);
}

function edificoSx() {
  id--;
  if (id<0) {id = imgLink.length-1};
  console.log(id);
}
