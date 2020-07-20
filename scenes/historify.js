const fs = require('fs')

let scene = JSON.parse(fs.readFileSync('simple.json'))


let items = Object.keys(scene.nodes)


for(i=0;i<items.length;i++){
    let module = scene.nodes[items[i]]
    let nodes = Object.keys(module)
    // console.log(module,nodes)
    for(j=0;j<nodes.length;j++){
        if(module[nodes[j]]._props && module[nodes[j]]._props.kind === 'outlet'){
            
            module[nodes[j]]._props['history'] = false
            console.log(module)
            
        }
        

    }
    
}
fs.writeFileSync('simple.json', JSON.stringify(scene, null, 2))