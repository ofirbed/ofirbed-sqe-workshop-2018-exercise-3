import * as esprima from 'esprima';


var inputCode;


const functions = new Map();
functions.set('FunctionDeclaration',handleFunction);
functions.set('VariableDeclaration',handleVariableMultiDec);
functions.set('VariableDeclarator',handleVariableDec);
functions.set('ExpressionStatement',handleExprStatement);
functions.set('WhileStatement',handleWhile);
functions.set('BlockStatement',handleBlockStatement);
functions.set('IfStatement',handleIfStatement);
functions.set('ReturnStatement',handleReturnStatement);


var flowChart_str;
var connectors;
var index;
var afterIfStatment = false;
var inputVector;
var paramList;

var tablesVar;


function handleReturnStatement(parsedCode,isGreen) {
    let lRange = parsedCode.range[0];
    let rRange = parsedCode.range[1];
    let ret_code = inputCode.substring(lRange,rRange);
    flowChart_str += createOperationRow(index,ret_code,isGreen);
    connectToLastBlock('op'+index);

}

function ReplaceTestField_IfNecessary(parsed, table) {
    if (parsed.type === 'BinaryExpression') {
        let newLeft =ReplaceLeftField_IfNecessary(parsed, table);
        let newRight =ReplaceRightField_IfNecessary(parsed, table);
        return ''+newLeft+parsed.operator+newRight;
    }

    if (parsed.type === 'Identifier') {
        let res = table.get(parsed.name);
        if (res !== undefined)
            return res;
    }
    return inputCode.substring(parsed.range[0],parsed.range[1]);
}



function evalExpr(test_code) {
    let testCodeAfterSubtitiosion = ReplaceTestField_IfNecessary(test_code,getLastLocalTable());
    var code = '(function foo ' + paramList + '{ return ' + testCodeAfterSubtitiosion + ';})(' + inputVector + ')';
    return eval(code);
}

function handleIfStatement(parsedCode,isGreen) {
    let  i=index;
    let lRange = parsedCode.test.range[0];
    let rRange = parsedCode.test.range[1];
    let test_code = inputCode.substring(lRange,rRange);
    flowChart_str += createConditionRow(i,test_code,isGreen);
    connectToLastBlock('cond'+i);
    createBlockConnection('cond'+i+'(yes)');
    index++;
    let new_isGreen =isGreen && evalExpr(parsedCode.test);
    analyze(parsedCode.consequent,new_isGreen);
    if(parsedCode.alternate!==undefined && parsedCode.alternate!==null) {
        createBlockConnection('cond' + i + '(no)');
        analyze(parsedCode.alternate,(isGreen && !new_isGreen));
    }

    afterIfStatment = true;
}


function handleBlockStatement(parsedCode,isGreen){
    parsedCode.body.map(curr => analyze(curr,isGreen));

}


function handleWhile(parsedCode,isGreen){
    flowChart_str += createOperationRow(index,'NULL',isGreen);
    connectToLastBlock('op'+index);
    createBlockConnection('op'+index);
    let  i=index;
    index++;
    let lRange = parsedCode.test.range[0];
    let rRange = parsedCode.test.range[1];
    let test_code = inputCode.substring(lRange,rRange);
    flowChart_str += createConditionRow(index,test_code,isGreen);
    let indexOfWhile = index;
    index++;
    connectToLastBlock('cond'+indexOfWhile);
    createBlockConnection('cond'+indexOfWhile+'(yes)');
    let new_isGreen =isGreen && evalExpr(parsedCode.test);
    analyze(parsedCode.body,new_isGreen);
    connectToLastBlock('op'+i);
    createBlockConnection('cond'+indexOfWhile+'(no)');

}


function replaceUpdateExpAndSetTheTable(parsed,table) {
    let name = parsed.argument.name;
    let operator = parsed.operator[0];
    let res = table.get(name);
    if (res !== undefined)
        table.set(name,''+res+operator+'1');
    else
        table.set(name,''+name+operator+'1');
}

function handleExprStatement(parsedCode,isGreen){
    if(parsedCode.expression.type==='AssignmentExpression')
        insertToLocalsMap(parsedCode.expression.left.name,parsedCode,getLastLocalTable());

    if(parsedCode.expression.type==='UpdateExpression') {   //replace update with the non syntactic suger exp
        replaceUpdateExpAndSetTheTable(parsedCode.expression,getLastLocalTable()) ;
    }


    handleOperatorExpr(parsedCode,isGreen);

}


function createOperationRow(index, s,isGreen) {
    let i = '-'+index+'-\n';
    if(isGreen)
        return  'op'+index+'=>operation: '+i+s+'|approved'+'\n';
    else
        return  'op'+index+'=>operation: '+i+s+'\n';
}


function createConditionRow(index, s,isGreen) {
    let i = '-'+index+'-\n';
    if(isGreen)
        return  'cond'+index+'=>condition: '+i+s+'|approved'+'\n';
    else
        return  'cond'+index+'=>condition: '+i+s+'\n';
}


function createBlockConnection(toInsert) {
    connectors.push([toInsert,'']);

}


function lastRowContain(str) {
    if(connectors.length===0)
        return false;
    let lastElement = connectors[connectors.length-1][0];
    return lastElement.startsWith(str);

}


function connectToLastBlock(s) {
    if(connectors.length===0)
        return;
    if(lastRowContain('cond') && connectors[connectors.length-1][1] ==='') {
        connectors[connectors.length - 1][1] = '->' + s;
    }else{
        connectors.map(curr => {
            if(curr[1]==='') {
                curr[1] = '->' + s+'\n';

            }
        });
    }
}


function getLastLocalTable(){
    return tablesVar[tablesVar.length-1];
}


function substituteAssignment(parsedCode, table) {
    return ReplaceRightField_IfNecessary(parsedCode, table);
}


function ReplaceRightField_IfNecessary(parsed, table) {
    if (parsed.right.type === 'BinaryExpression') {
        let newLeft =ReplaceLeftField_IfNecessary(parsed.right, table);
        let newRight = ReplaceRightField_IfNecessary(parsed.right, table);
        return ''+newLeft+parsed.right.operator+newRight;

    }

    if (parsed.right.type === 'Identifier') {
        let res = table.get(parsed.right.name);
        if (res !== undefined)
            return res;
    }
    return inputCode.substring(parsed.right.range[0],parsed.right.range[1]);
}


function ReplaceLeftField_IfNecessary(parsed, table) {
    if (parsed.left.type === 'BinaryExpression') {
        let newLeft =ReplaceLeftField_IfNecessary(parsed.left, table);
        let newRight =ReplaceRightField_IfNecessary(parsed.left, table);
        return ''+newLeft+parsed.left.operator+newRight;
    }

    if (parsed.left.type === 'Identifier') {
        let res = table.get(parsed.left.name);
        if (res !== undefined)
            return res;
    }
    return inputCode.substring(parsed.left.range[0],parsed.left.range[1]);
}


function insertToLocalsMap(val,parsed,table){
    let realValue;
    if(parsed.type==='ExpressionStatement') {
        realValue = substituteAssignment(parsed.expression, table);
        table.set(val,realValue);
    }
    else {
        realValue = ReplaceInitField_IfNecessary(parsed, table);
        table.set(val, realValue);
    }
}


function ReplaceInitField_IfNecessary(parsed, table) {
    let temp_parse = parsed;
    if (parsed.init.type === 'BinaryExpression') {
        let newLeft = ReplaceLeftField_IfNecessary(temp_parse.init, table);
        let newRight =ReplaceRightField_IfNecessary(temp_parse.init, table);
        return ''+newLeft+parsed.init.operator+newRight;
    }

    if (parsed.init.type === 'Identifier') {
        let res = table.get(parsed.init.name);
        if (res !== undefined)
            return  res;
    }
    return inputCode.substring(parsed.init.range[0],parsed.init.range[1]);
}


function handleVariableDec(parsedCode,isGreen) {
    insertToLocalsMap(parsedCode.id.name,parsedCode,getLastLocalTable());
    handleOperatorExpr(parsedCode,isGreen);
}


function handleOperatorExpr(parsedCode,isGreen){
    let lRange = parsedCode.range[0];
    let rRange = parsedCode.range[1];
    let code = inputCode.substring(lRange,rRange);
    if(!lastRowContain('op'+(index-1)) || afterIfStatment){    //If the last block is not a operation block
        flowChart_str += createOperationRow(index,code,isGreen);
        connectToLastBlock('op'+index);
        createBlockConnection('op'+index);
        index++;
        afterIfStatment=false;
    }else
    {
        if(isGreen){    //if it is in green block so we need to pass the '|approved' to the new line
            flowChart_str=flowChart_str.substring(0,flowChart_str.length-10)+'\n';
            flowChart_str += code+'|approved\n';
        }else
            flowChart_str += code+'\n';
    }
}


function handleVariableMultiDec(parsedCode,isGreen) {
    parsedCode.declarations.map(curr => analyze(curr,isGreen));
}


function handleFunction(parsedCode,isGreen) {
    paramList = parsedCode.params.reduce((acc,vari)=> acc + vari.name+',','');
    paramList=paramList.substring(0,paramList.length-1);
    paramList='('+paramList+')';    //Set param list as string like (param1,param2....paramN)
    analyze(parsedCode.body,isGreen);
}


function analyze(parsedCode,isGreen) {
    let func= functions.get(parsedCode.type);
    func(parsedCode,isGreen);

}


const parseCode = (codeToParse,inputVec) => {
    inputCode = codeToParse;
    inputVector = inputVec;
    let parsedCode = esprima.parseScript(codeToParse,{loc: true, range: true});
    connectors=new Array();
    index=1;
    flowChart_str='';
    afterIfStatment=false;
    tablesVar = [new Map()];
    analyze(parsedCode.body[0],true);

    connectors.map(curr =>{
        if(curr[1] !==''){
            flowChart_str += ''+curr[0] + curr[1]+'\n';
        }});



    return flowChart_str;
};




export {parseCode,analyze,createOperationRow,createConditionRow,createBlockConnection};
