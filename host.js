const WebSocket = require('ws');
// const app = require('express')()
// const http = require('http').createServer(app);;

const fs = require('fs')
let listenPort = (process.env.PORT || 8081)
const deltaWebsocketServer = new WebSocket.Server({ 'port': listenPort, clientTracking: true });

const got = require("./gotlib/got.js")
const { argv } = require('yargs');
let quotes = JSON.parse(fs.readFileSync('./strangelove.json'))



// let sceneFiles = []
// fs.readdirSync('./scenes').forEach(file => {
//   sceneFiles.push(file)
// });
// console.log(sceneFiles)

setInterval(() => {
  deltaWebsocketServer.clients.forEach((client) => {
    client.send(JSON.stringify({
      cmd: 'ping',
      //data: guestlist,
      date: Date.now() 
    }))
  });
}, 3000);


setInterval(() => {
  deltaWebsocketServer.clients.forEach((client) => {
    client.send(JSON.stringify({
      cmd: 'keyFrame',
      data: localGraph,
      date: Date.now() 
    }))
  });
}, 20000);

// the OT history for a given session:
let history = []

// a local copy of the current graph state, for synchronization purposes
let localGraph = {
	nodes: {},
	arcs: []
}

function storeSession(){
  fs.writeFileSync('./scenes/sessionFile.json', JSON.stringify(localGraph, null, '\t'))
}
storeSession()
// loadScene('scene_feedback.json')

let recordStatus = 0

let sessionId = 0;
console.log('running deltaWebsocket as HOST')

// let configp2p = JSON.stringify({
//   cmd: 'p2pSignalServer',
//   date: Date.now(), 
//   data: localConfig.p2pSignalServer
// })
// sendAllLocalClients(configp2p)
// whenever a pal connects to this websocket:
deltaWebsocketServer.on('connection', function(ws, req) {
  deltaWebsocket = ws
  let source;

  
  // let sceneListMsg = JSON.stringify({
  //   cmd:'sceneList',
  //   date: Date.now(),
  //   data: sceneFiles
  // })
  // deltaWebsocket.send(sceneListMsg)

  let deltas = got.deltasFromGraph(localGraph, []);
  let msg = JSON.stringify({
    cmd:'deltas',
    date: Date.now(),
    data: deltas
  })
  deltaWebsocket.send(msg)
    
  console.log(localGraph)
  // do any
  console.log("server received a connection");
  console.log("server has "+deltaWebsocketServer.clients.size+" connected clients");
  //	ws.id = uuid.v4();
  const id = ++sessionId;
  // const location = url.parse(req.url, true);
  // ip = req.connection.remoteAddress.split(':')[3] 
  ip = req.headers.host.split(':')[0]
  if(!ip){
    // console.log('vr', req.connection)
    ip = req.ip
  }
  //console.log(ip)
  // const location = urlw.parse(req.url, true);
  // console.log(location)

  deltaWebsocket.on('error', function (e) {
    if (e.message === "read ECONNRESET") {
      // ignore this, client will still emit close event
    } else {
      console.error("websocket error: ", e.message);
    }
  });

  // what to do if client disconnects?
  deltaWebsocket.on('close', function(connection) {
    //clearInterval(handShakeInterval);
    if(deltaWebsocketServer.clients.size === 0){
      // clearInterval(interval);
    }
    console.log("deltaWebsocket: connection closed");
        console.log("server has "+deltaWebsocketServer.clients.size+" connected clients");
  });
  
  // respond to any messages from the client:
  deltaWebsocket.on('message', function(e) {
    if (e instanceof Buffer) {
      // get an arraybuffer from the message:
      const ab = e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength);
      //console.log("received arraybuffer", ab);
      // as float32s:
      //console.log(new Float32Array(ab));

    } else {
      try {
        handlemessage(JSON.parse(e), ws);
        
      } catch (e) {
        console.log('bad JSON: ', e);
      }
    }
  });

});


function handlemessage(msg, deltaWebsocket) {

  switch (msg.cmd) {

    case 'rsvp':{
      source = msg.data
    }
    break;

    case 'keepAlive':
      // ignore 
      // console.log('line 167', msg)
    break


    case "deltas": {
      let attempt
      // runGOT(id, msg.data)

      // synchronize our local copy:
      try {

        attempt = got.applyDeltasToGraph(localGraph, msg.data);

        
      } catch (e) {
        console.warn(e);
        //
      }
      // if the got detected a malformed delta (or a conflict delta for which we do not have a merge strategy), it will be reported as an object in an array after the graph
      if (attempt && attempt.length > 1 && attempt[1]){
        

        switch(attempt[1].type){
          case "conflictDelta":
          // for now, a conflict delta will still be passed through, just so we can test and capture when they occur
          // feedback path stuff
          for(i=0;i<deltaMsg.data.length; i++){
            // if a connection delta, check if history node is needed: 
            if(deltaMsg.data[i].op === 'connect'){
              console.log(deltaMsg.data[i])
              let historyDelta = getHistoryPropchanges(deltaMsg.data[i])
              let msg = JSON.stringify({
                cmd: 'deltas',
                date: Date.now(),
                data: historyDelta
              })
              send_to_other_clients(msg)
              
            }
            else {
              let msg = JSON.stringify({
                cmd: 'deltas',
                date: Date.now(),
                data: deltaMsg.data
              })
              
              send_to_other_clients(msg)
              
              
            }
          }
          break
          case "malformedDelta":
            let quote = quotes.sort(function() {return 0.5 - Math.random()})[0]
            // report malformed delta to client, with humour...
            let clientMsg = JSON.stringify({
              cmd: 'nuclearOption',
              data: attempt[1],
              quote: quote
            })
            deltaWebsocket.send(clientMsg)
            // then disconnect, forcing it to wipe its scene and rejoin
            deltaWebsocket.close()
          break

        }
        return
      } else {
        // got detected no malformed deltas!

        // store current session to the sessionFile
        storeSession()
        let response = {
          cmd: "deltas",
          date: Date.now(),
          data: msg.data
        };
        // check if the recording status is active, if so push received delta(s) to the recordJSON
        if (recordStatus === 1){        
          for(i = 0; i < msg.data.length; i++){           
            msg.data[i]["timestamp"] = Date.now()
            recordJSON.deltas.push(msg.data[i])
          }    
        }
        send_to_other_clients(JSON.stringify(response), deltaWebsocket)
      }
    } 
    break;

    case "fromTeaparty":

    break

    case "loadScene":
      // first clear scene:
      // let clearMsg = JSON.stringify({
      //   cmd:'deltas',
      //   date: Date.now(),
      //   data: clearScene()
      // })
      // send_all_clients(clearMsg)

      // then load & send the requested scene as list of deltas
      // let sceneMsg = JSON.stringify({
      //   cmd:'deltas',
      //   date: Date.now(),
      //   data: loadScene(msg.data)
      // })
      // send_all_clients(sceneMsg)

    break

    case "saveScene":
      console.log('writing file ', msg.data, typeof msg.data)
      fs.writeFileSync('./scenes/' + msg.data, JSON.stringify(localGraph))

      sceneFiles.length = 0
      fs.readdirSync('./scenes').forEach(file => {
        sceneFiles.push(file)
      });
      sceneUpdate = JSON.stringify({
        cmd: 'sceneList',
        date: Date.now(),
        data: sceneFiles
      })
      send_all_clients(sceneUpdate)
    break

    case "deleteScene":
      if (!msg.data || msg.data === '' || msg.data === undefined){
        // test again
        // basically want to prevent just the scenes folder from being removed...
      } else {
        let deletePath = './scenes/' + msg.data
        fs.unlink(deletePath, (err) => {
          if (err) {
            console.error(err)
            return
          }
          sceneFiles.length = 0
          fs.readdirSync('./scenes').forEach(file => {
            sceneFiles.push(file)
          });
          sceneUpdate = JSON.stringify({
            cmd: 'sceneList',
            date: Date.now(),
            data: sceneFiles
          })
          send_all_clients(sceneUpdate)
        })
      }
    break

    case "clearScene":

      msg = JSON.stringify({
        cmd:'deltas',
        date: Date.now(),
        data: clearScene()
      })
      send_all_clients(msg)

    break;

    case "nuclearOption":
      // close this client's connection
      let quote = quotes.sort(function() {return 0.5 - Math.random()})[0]
      msg = JSON.stringify({
        cmd:'nuclearOption',
        date: Date.now(),
        data: quote
      })
      deltaWebsocket.send(msg)
      
    break

    default: console.log("received JSON", msg, typeof msg);
  }
}


  // send a (string) message to all connected clients:
function send_all_clients(msg) {
	deltaWebsocketServer.clients.forEach(function each(client) {
		try {
			client.send(msg);
		} catch (e) {
			console.error(e);
		};
	});
}

// send to all clients EXCEPT for the one specified at ignore
function send_to_other_clients(msg, ignore) {
	deltaWebsocketServer.clients.forEach(function each(client) {
		if (client == ignore) {
      return
    }
		try {
			client.send(msg);
		} catch (e) {
			console.error(e);
		};
	});
}

function clearScene(){
  let deltas = got.deltasFromGraph(localGraph, []);
  let inverse = got.inverseDelta(deltas)
  localGraph = got.applyDeltasToGraph(localGraph, inverse)
  return inverse
}

// function loadScene(sceneName){

//   localGraph = JSON.parse(fs.readFileSync(__dirname + "/scenes/" + sceneName))
// // fs.writeFileSync('simpleGraph.json', JSON.stringify(sceneFile))
//   console.log('var localGraph set to file /scenes/' + sceneName, localGraph)
//   let deltas = got.deltasFromGraph(localGraph, []);
//   return deltas
// }



