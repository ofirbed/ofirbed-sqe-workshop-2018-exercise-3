import $ from 'jquery';
import { parseCode} from './code-analyzer';
import * as flowchart from 'flowchart.js';
var safeEval = require('safe-eval');





$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        document.getElementById('diagram').innerText='';
        var codeToParse = $('#codePlaceholder').val();
        var inputVector = $('#InputVector').val();
        let flowChart_str = parseCode(codeToParse,inputVector);
        DisplayTable(flowChart_str);
    });
});



function paint(str) {
    var diagram = flowchart.parse(str);

    diagram.drawSVG(document.getElementById('diagram'), { 'x': 0, 'y': 0, 'line-width': 3, 'line-length': 50, 'text-margin': 10, 'font-size': 14, 'font-color': 'black', 'line-color': 'black', 'element-color': 'black', 'fill': 'white', 'yes-text': 'T', 'no-text': 'F', 'arrow-end': 'block', 'scale': 1, 'symbols': { 'start': { 'font-color': 'red', 'element-color': 'green', 'fill': 'yellow' }, 'end':{ 'class': 'end-element' } }, 'flowstate' : { 'approved' : { 'fill' : '#58C4A3', 'font-size' : 12, 'yes-text' : 'T', 'no-text' : 'F' }, 'rejected' : { 'fill' : '#C45879', 'font-size' : 12, 'yes-text' : 'T', 'no-text' : 'F' } } });

}

function DisplayTable(table) {

    paint(table);
}

function eval_func(code){
    return safeEval((code));
}

export {eval_func};




