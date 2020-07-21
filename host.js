const WebSocket = require('ws');
// const app = require('express')()
// const http = require('http').createServer(app);;

const fs = require('fs')
let listenPort = (process.env.PORT || 8081)
const deltaWebsocketServer = new WebSocket.Server({ 'port': listenPort, clientTracking: true });

const got = require("./gotlib/got.js")
const { argv } = require('yargs');
let quotes = JSON.parse(fs.readFileSync('./strangelove.json'))

// const enumerateFiles = require('enumerate-files');

// (async () => {
//   const files = await enumerateFiles('./scenes');
//   /* Set {
//     '/Users/example/node_modules/LICENSE',
//     '/Users/example/node_modules/README.md',
//     '/Users/example/node_modules/index.js',
//     '/Users/example/node_modules/package.json'
//   } */
//   console.log(files.Set)
// })();
let sceneFiles = []
fs.readdirSync('./scenes').forEach(file => {
  sceneFiles.push(file)
});
console.log(sceneFiles)

// let deltaWebsocket;

// custom keepAlive function to detect and handle broken connections

// function noop() {}

// function heartbeat() {
//   this.isAlive = true;
// }

// const interval = setInterval(function ping() {
//   deltaWebsocketServer.clients.forEach(function each(ws) {
//     if (ws.isAlive === false) {
//       // console.log(ws)
//       return ws.terminate();
//     }
 
//     ws.isAlive = false;
//     ws.ping(noop);
//   });
// }, 3000);

setInterval(() => {
  deltaWebsocketServer.clients.forEach((client) => {
    client.send(JSON.stringify({
      cmd: 'ping',
      //data: guestlist,
      date: Date.now() 
    }))
  });
}, 3000);


// a local copy of the current graph state, for synchronization purposes
let localGraph = {
	nodes: {},
	arcs: []
}

loadScene('scene_feedback.json')

let recordStatus = 0
// http.listen(listenPort, function(){
//   // console.log('listening on ' + listenPort);
// })



  // const p2pSignalBroker = require('coven/server');
  // const DEFAULT_PORT = 8082; 
  // const PORT = +(process.env.PORT || DEFAULT_PORT);
 
  // p2pSignalBroker({
  //   port: PORT,
  //   onMessage({ room, type, origin, target }) {
  //     console.log(`[${room}::${type}] ${origin} -> ${target || '<BROADCAST>'}`);
  //   },
  // });



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

    
    let sceneListMsg = JSON.stringify({
      cmd:'sceneList',
      date: Date.now(),
      data: sceneFiles
    })
    deltaWebsocket.send(sceneListMsg)

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
        
        // runGOT(id, msg.data)

        // synchronize our local copy:
			try {
				//console.log('\n\npreApply', localGraph.nodes.resofilter_120)
				got.applyDeltasToGraph(localGraph, msg.data);
				//console.log('\n\npostApply', JSON.stringify(localGraph.nodes.resofilter_120.resonance))
			} catch (e) {
				console.warn(e);
			}

			//console.log(msg.data)
			
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

			//fs.appendFileSync(OTHistoryFile, ',' + JSON.stringify(response), "utf-8")

			//OTHistory.push(JSON.stringify(response))
			
			// send_all_clients(JSON.stringify(response));
      send_to_other_clients(JSON.stringify(response), deltaWebsocket)
      } break;

      case "fromTeaparty":


      break

      case "loadScene":
        // first clear scene:
       let clearMsg = JSON.stringify({
          cmd:'deltas',
          date: Date.now(),
          data: clearScene()
        })
        send_all_clients(clearMsg)

        // then load the requested scene

        let sceneMsg = JSON.stringify({
          cmd:'deltas',
          date: Date.now(),
          data: loadScene(msg.data)
        })
        send_all_clients(sceneMsg)

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
        // close all this client's connection
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

function loadScene(sceneName){

  localGraph = JSON.parse(fs.readFileSync(__dirname + "/scenes/" + sceneName))
// fs.writeFileSync('simpleGraph.json', JSON.stringify(sceneFile))
  console.log('var localGraph set to file /scenes/' + sceneName, localGraph)
  let deltas = got.deltasFromGraph(localGraph, []);
  return deltas
}

// const createSignalingBroker = require('coven/server');
// const DEFAULT_PORT = 8082;
// // const PORT = +(process.env.PORT || DEFAULT_PORT);
 
// createSignalingBroker({
//   port: DEFAULT_PORT,
//   onMessage({ room, type, origin, target }) {
//     console.log(`[${room}::${type}] ${origin} -> ${target || '<BROADCAST>'}`);
//   },
// });



