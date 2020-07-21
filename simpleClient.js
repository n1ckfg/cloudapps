const WebSocket = require('ws');
 
const ws = new WebSocket('ws://localhost:8081');
 
ws.on('open', function open() {

});
count = 4 
ws.on('message', function incoming(data) {
  console.log(data);
  count++
  sp = "speaker_" + count
  ws.send(JSON.stringify({
    cmd: 'deltas',
    data:{
        op:"newnode",
        kind: "speaker",
        path: sp,
        name: sp,
        pos: [0, 0, 1],
        orient: [0, 0, 1, 1]
    }
}));

});