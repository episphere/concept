const fs = require('fs');
const readline = require('readline')
let conceptIdVariants = ["@id","conceptId"];
const { v4: uuidv4 } = require('uuid');
let jsonList = [];
let currIds = [];

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

function generateRandomUUID(conceptIdList){
    //return uuidv4();
    let num = generateNine()
    while(!conceptIdList.includes(num)){
        let num = generateNine();
        return num;
    }
}

function processCluster(cluster, header, indexConceptId, nameToConcept, indexVariableName, conceptIdList){
    let nonEmpty = [];
    for(let i = 1; i < cluster.length; i++){
        let currArr = cluster[i]
        for(let j = 0; j < currArr.length; j++){
            if(currArr[j]!='' && j != indexConceptId){
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
        if(firstRow[i] != "" && !nonEmpty.includes(i) && i != indexConceptId){
            firstRowJSON[header[i]] = firstRow[i]
        }
    }
    //console.log(firstRowJSON)
    if(indexConceptId == -1 || firstRowJSON[header[indexConceptId]] == ''){
        if(nameToConcept.hasOwnProperty(firstRow[indexVariableName])){
            firstRowJSON['conceptId'] = nameToConcept[firstRow[indexVariableName]]
            if(!conceptIdList.includes(firstRowJSON['conceptId'])){
                conceptIdList.push(firstRowJSON['conceptId'])
                console.log(firstRowJSON['conceptId'])
            }
        }
        else{
             firstRowJSON['conceptId'] = generateRandomUUID(conceptIdList);
             conceptIdList.push(firstRowJSON['conceptId'])
             nameToConcept[firstRow[indexVariableName]] = firstRowJSON['conceptId']
        }
       
        
    }
    

    let collections = [];
    let collectionIds = [];
    let leaves = []
    let leafIndex = -1;
    for(let i = 0; i < cluster.length; i++){
        let ids = [];
        let currCollection = {}
        let leaf = ''
        
        for(let j = 0; j < nonEmpty.length; j++){
            let currObject = {} 
            let currRow = cluster[i];
            
            let nonEmptyIndex = nonEmpty[j];
            
            let currValue = currRow[nonEmptyIndex]
            if(currValue.indexOf('=') != -1){
                leaf = currValue;
                leafIndex = nonEmptyIndex;
                leaves.push(currValue)
            }
            
            else{
                if(currRow[nonEmptyIndex] != ''){
                    currCollection[header[nonEmptyIndex]] = currRow[nonEmptyIndex]
                }
            }
            
        }
        if(Object.keys(currCollection).length != 0){
            let cid = generateRandomUUID(conceptIdList)
            let objKeys = Object.keys(currCollection);
            for(let i = 0; i < objKeys.length; i++){
                //console.log(key)
                let key = objKeys[i];
                if(nameToConcept.hasOwnProperty(currCollection[key])){
                    cid = nameToConcept[currCollection[key]]
                }
            }
            if(currCollection.hasOwnProperty('conceptId')){
                cid = currCollection['conceptId'];
            }
            if(!conceptIdList.includes(cid)){
                conceptIdList.push(cid);
            }
            currCollection['conceptId'] = cid;
            collectionIds.push(cid + '.json')
            for(let i = 0; i < objKeys.length; i++){
                //console.log(key)
                let key = objKeys[i]
                nameToConcept[currCollection[key]] = cid;
            }
            collections.push(currCollection);
            //fs.writeFileSync(cid + '.json', currCollection);
        }   


    }
    let leafIds = []
    let leafObj = {}
    for(let i = 0; i < leaves.length; i++){
        let leaf = leaves[i];
        let val = leaf.split('=')[1].trim()
        let key = leaf.split('=')[0].trim()
        let cid = generateRandomUUID(conceptIdList)
        if(nameToConcept.hasOwnProperty(val)){
            cid = nameToConcept[val]
        }
        else{
            //fs.writeFileSync(cid + '.json', JSON.stringify({'conceptId':cid, 'variableName':val}));
            jsonList.push({'conceptId':cid, 'variableName':val})
            nameToConcept[val] = cid
        }
        if(!conceptIdList.includes(cid)){
            conceptIdList.push(cid)
        }
        leafObj[key] = cid + '.json'
    }  

    if(collections.length == 0  && leaves.length > 0){
        firstRowJSON[header[leafIndex]] = leafObj;
    }
    else{
        firstRowJSON['subcollection'] = collectionIds;
        for(let i = 0; i < collections.length; i++){
            let currCollection = collections[i]
            currCollection[header[leafIndex]] = leafObj;
            //fs.writeFileSync(currCollection['conceptId']+ '.json', JSON.stringify(currCollection));
            jsonList.push(currCollection)
        }
    }
    if(indexConceptId == -1 || firstRowJSON[header[indexConceptId]] == ''){
        firstRowJSON['conceptId'] = generateRandomUUID(conceptIdList);
        if(nameToConcept.hasOwnProperty(firstRowJSON[header[indexVariableName]])){
            firstRowJSON['conceptId'] = nameToConcept[firstRowJSON[header[indexVariableName]]];
        }
        nameToConcept[firstRowJSON[header[indexVariableName]]] = firstRowJSON['conceptId']
    }
    else{
        firstRowJSON['conceptId'] = cluster[0][indexConceptId]
        
        nameToConcept[firstRowJSON[header[indexVariableName]]] = firstRowJSON['conceptId']
        //console.log(cluster[0][indexConceptId])
    }
    jsonList.push(firstRowJSON);

}

function CSVToArray(strData){
    let arr = [];
    while(strData.indexOf(",") != -1 ){
        let toPush = "";
        if(strData.substring(0,1) == "\""){
            strData = strData.substring(1);
            toPush = strData.substring(0,  strData.indexOf("\""));    
            strData = strData.substring(strData.indexOf("\"") + 1);    
            strData = strData.substring(strData.indexOf(',')+1)
        }
        else{
            toPush = strData.substring(0, strData.indexOf(','));
            strData = strData.substring(strData.indexOf(',') + 1)
        }
        arr.push(toPush)

        //let nextQuote = strData.indexOf("\"")
    }
    if(strData != ""){
        arr.push(strData);
    }

    // Return the parsed data.
    return( arr );
}


async function readFile(){
    let ConceptIndex = '{}'
    if(fs.existsSync('varToConcept.json')){
        ConceptIndex = fs.readFileSync('varToConcept.json', {encoding:'utf8'})
        //console.log(ConceptIndex);
    }
    let idIndex = '[]'
    if(fs.existsSync('conceptIds.txt')){
        idIndex = fs.readFileSync('conceptIds.txt', {encoding:'utf8'})
    }
    console.log('idIndex: ' + idIndex)
    let conceptIdList = JSON.parse(idIndex)
    let varLabelIndex = 0;
    let cluster = []
    const fileStream = fs.createReadStream('prelude1Concept.csv');
    const outFile = 'prelude1Concept1.csv'
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })
    let first = true;
    let currCluster = false;
    let header = [];
    let indexConceptId = -1;
    let nameToConcept = JSON.parse(ConceptIndex);
    //console.log(nameToConcept)
    for await(const line of rl){
        //console.log(line)
        //let arr = line.split(',');
        let arr = CSVToArray(line, ',')
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
                processCluster(cluster, header, indexConceptId, nameToConcept, varLabelIndex, conceptIdList)
                //console.log(cluster);
                //console.log(cluster)
                cluster = [arr]
                currCluster = true;
            }
        }
        else{
            cluster.push(arr)
            currCluster = true;
        }
    }
    processCluster(cluster, header, indexConceptId, nameToConcept, varLabelIndex, conceptIdList);
    for(let i = 0; i < cluster.length; i++){
        //for(let j = 0; j < cluster[i].length; j++){
            if(indexConceptId == -1){
                //console.log("\"" + cluster[i][0].join() + "\"")
                if(cluster[i][0].length != 0){
                    cluster[i][0] = "\"[" + cluster[i][0].join() + "]\""
                }
                //fs.appendFileSync(outFile, cluster[i].join() + '\n');
            }
        //}
        
    }    
    console.log(jsonList)
    fs.writeFileSync('varToConcept.json', JSON.stringify(nameToConcept))
    fs.writeFileSync('conceptIds.txt', JSON.stringify(conceptIdList))
    //console.log(conceptIdList)
}
readFile();