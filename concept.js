console.log('concept.js loaded')
const fs = require('fs');
const readline = require('readline')
let conceptIdVariants = ["@id","conceptId"];
const { v4: uuidv4 } = require('uuid');
let jsonList = [];
let currIds = [];
function csvToJSON(){
    fs.readFile('./prelude.csv',(err, data) =>{
        if(err){
            console.log(err)
            return
        }
        console.log(data);
        console.log('break!')
    })
}

function mashTogether(id, row){
    
}
//For now, we will have an array of Objects, dont even bother with changing existing jsons for now




function getConceptIdIndex (header){
        for(let j = 0; j < conceptIdVariants.length; j++){
            let index = header.indexOf(conceptIdVariants[j])
            if(index != -1){
                return index;
            }
        }
        return -1;
}

function generateNine(){
    let a = ''
    for(let i = 0; i < 9; i++){
        let b = Math.floor(Math.random()*10)
        a += b
    }
    return a;
}

function generateRandomUUID(){
    //return uuidv4();
    let num = generateNine()
    while(!currIds.includes(num)){
        let num = generateNine();
        currIds.push(num);
        return num;
    }
}

function processCluster(cluster, header, indexConceptId, outFile){

    let nonEmpty = []; //nonEmpty represents the columns that are stacked
    //each stacked column will have one json for each row with something in that stacked column
    for(let i = 1; i < cluster.length; i++){
        let currArr = cluster[i]
        for(let j = 0; j < currArr.length; j++){
            if(currArr[j]!=''){
                if(!nonEmpty.includes(j)){
                    nonEmpty.push(j)
                }
            }
        }
    }   
    
    let firstRowJSON = {}
    let firstRow = cluster[0]
    let clump = [];
    for(let i = 0; i < firstRow.length; i++){
        if(firstRow[i] != "" && !nonEmpty.includes(i)){
            firstRowJSON[header[i]] = firstRow[i]
        }
    }
    if(indexConceptId == -1 || firstRowJSON[header[indexConceptId]] == ''){
        if(indexConceptId == -1){
            //console.log(outFile)
            //fs.appendFileSync(outFile,firstRowJSON['conceptId'] + ',' + firstRow.join() + '\n');
        }
        firstRowJSON['conceptId'] = generateRandomUUID();
    }
    
    
    for(let j = 0; j < nonEmpty.length; j++){
        let currAggregate = [];
        for(let i = 0; i < cluster.length; i++){
            let currObject = {};
            let currRow = cluster[i];
            let nonEmptyIndex = nonEmpty[j];
            if(currRow[nonEmptyIndex] != ''){
                currObject = Object.assign({}, firstRowJSON)
                currObject[header[nonEmptyIndex]] = currRow[nonEmptyIndex]
                if(indexConceptId == -1 || currObject[header[indexConceptId]] == ''){
                    currObject['conceptId'] = generateRandomUUID();
                }
                clump.push(currObject['conceptId'])
                jsonList.push(currObject);
                
                let stringObj = JSON.stringify(currObject);
                /*if(indexConceptId == -1) {
                    fs.appendFileSync(outFile, ',' + currRow.join() + '\n');
                }*/
                fs.writeFileSync(currObject['conceptId'] + '.json', stringObj);
                currAggregate.push(currObject['conceptId'] + '.json');
            }   
        }
        firstRowJSON[header[nonEmpty[j]]] = currAggregate;
       
    }
    jsonList.push(firstRowJSON)
    let stringObj = JSON.stringify(firstRowJSON);
    fs.writeFileSync(firstRowJSON['conceptId'] + '.json', stringObj);
}


async function readFile(){

    let varLabelIndex = 0;
    let cluster = []
    const fileStream = fs.createReadStream('prelude1.csv');
    const outFile = 'prelude1Concept.csv'
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })
    let first = true;
    let currCluster = false;
    let header = [];
    let indexConceptId = -1;
    for await(const line of rl){
        let arr = line.split(',');
        //console.log(arr)
        if(first){
            header = arr;
            first = false;
            indexConceptId = getConceptIdIndex(header);
            if(indexConceptId == -1){
                //fs.writeFileSync(outFile, 'conceptId,' + arr.join() + '\n')
            }
            for(let i = 0; i < arr.length; i++){
                if(arr[i] == "Variable Name"){
                    varLabelIndex = i;
                }
            }
        }
        else if(currCluster){
            if(arr[varLabelIndex] == ''){
                cluster.push(arr);
            }
            else{
                //console.log(outFile)
                processCluster(cluster, header, indexConceptId, outFile)
                cluster = [arr]
                currCluster = true;
            }
        }
        else{
            cluster.push(arr)
            currCluster = true;
        }
        //console.log(arr)
    }
    processCluster(cluster, header, indexConceptId, outFile);
    //console.log(jsonList.length);
    //console.log(jsonList)
    //console.log(header);
    //console.log(cluster)
}
readFile();


/*
fs.readFile('/Users/shenbn/Documents/test/concept/prelude.csv',(err, data) =>{
    if(err){
        console.log(err)
        return
    }
    console.log(data);
    console.log('break!')
})*/