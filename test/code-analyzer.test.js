import assert from 'assert';
import {parseCode,createOperationRow,createConditionRow,createBlockConnection} from '../src/js/code-analyzer';

describe('Create Valid Flowchart.js String', () => {
    it('Test1 - Example 1', () => {
        assert.equal(parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '    }\n' +
            '    \n' +
            '    return c;\n' +
            '}\n','1, 2, 3'),

        'op1=>operation: -1-\n' +
            'a = x + 1\n' +
            'b = a + y\n' +
            'c = 0|approved\n' +
            'cond2=>condition: -2-\n' +
            'b < z|approved\n' +
            'op3=>operation: -3-\n' +
            'c = c + 5;\n' +
            'cond4=>condition: -4-\n' +
            'b < z * 2|approved\n' +
            'op5=>operation: -5-\n' +
            'c = c + x + 5;|approved\n' +
            'op6=>operation: -6-\n' +
            'c = c + z + 5;\n' +
            'op7=>operation: -7-\n' +
            'return c;|approved\n' +
            'op1->cond2\n' +
            '\n' +
            'cond2(yes)->op3\n' +
            'op3->op7\n' +
            '\n' +
            'cond2(no)->cond4\n' +
            'cond4(yes)->op5\n' +
            'op5->op7\n' +
            '\n' +
            'cond4(no)->op6\n' +
            'op6->op7\n' +
            '\n');
    });


    it('Test2 - Example 2', () => {
        assert.equal(parseCode('function foo(x, y, z){\n' +
            '   let a = x + 1;\n' +
            '   let b = a + y;\n' +
            '   let c = 0;\n' +
            '   \n' +
            '   while (a < z) {\n' +
            '       c = a + b;\n' +
            '       z = c * 2;\n' +
            '       a++;\n' +
            '   }\n' +
            '   \n' +
            '   return z;}\n','1,2,6'),
        'op1=>operation: -1-\n' +
            'a = x + 1\n' +
            'b = a + y\n' +
            'c = 0|approved\n' +
            'op2=>operation: -2-\n' +
            'NULL|approved\n' +
            'cond3=>condition: -3-\n' +
            'a < z|approved\n' +
            'op4=>operation: -4-\n' +
            'c = a + b;\n' +
            'z = c * 2;\n' +
            'a++;|approved\n' +
            'op5=>operation: -5-\n' +
            'return z;|approved\n' +
            'op1->op2\n' +
            '\n' +
            'op2->cond3\n' +
            '\n' +
            'cond3(yes)->op4\n' +
            'op4->op2\n' +
            '\n' +
            'cond3(no)->op5\n' +
            '');
    });
});



describe('Small Tests', () => {
    it('test1', () => {
        assert.equal(parseCode('function foo(x, y){\n' +
            'let a=x;\n' +
            '  if(a){\n' +
            'x=y;\n' +
            '}\n' +
            '\n' +
            'if(1){\n' +
            'x=y+1;\n' +
            '}\n' +
            '   \n' +
            '   return x;\n' +
            '}\n','1,2'),'op1=>operation: -1-\n' +
            'a=x|approved\n' +
            'cond2=>condition: -2-\n' +
            'a|approved\n' +
            'op3=>operation: -3-\n' +
            'x=y;|approved\n' +
            'cond4=>condition: -4-\n' +
            '1|approved\n' +
            'op5=>operation: -5-\n' +
            'x=y+1;|approved\n' +
            'op6=>operation: -6-\n' +
            'return x;|approved\n' +
            'op1->cond2\n' +
            '\n' +
            'cond2(yes)->op3\n' +
            'op3->cond4\n' +
            '\n' +
            'cond4(yes)->op5\n' +
            'op5->op6\n\n');
    });

    it('test2', () => {
        assert.equal(parseCode('function foo(x, y){\n' +
            'x++;\n' +
            'return x;\n' +
            '}\n','1,2'),'op1=>operation: -1-\n' +
            'x++;|approved\n' +
            'op2=>operation: -2-\n' +
            'return x;|approved\n' +
            'op1->op2\n' +
            '\n' +
            '');
    });

    it('test3', () => {
        assert.equal(parseCode('function foo(x, y){\n' +
            'let a=x;\n' +
            'let b=a;\n' +
            '\n' +
            'if(2<1){\n' +
            'if(true){\n' +
            'a++;\n' +
            'b=0;\n' +
            '}\n' +
            '\n' +
            '}\n' +
            '\n' +
            'return b;\n' +
            '}\n','1,2'),'op1=>operation: -1-\n' +
            'a=x\n' +
            'b=a|approved\n' +
            'cond2=>condition: -2-\n' +
            '2<1|approved\n' +
            'cond3=>condition: -3-\n' +
            'true\n' +
            'op4=>operation: -4-\n' +
            'a++;\n' +
            'b=0;\n' +
            'op5=>operation: -5-\n' +
            'return b;|approved\n' +
            'op1->cond2\n' +
            '\n' +
            'cond2(yes)->cond3\n' +
            'cond3(yes)->op4\n' +
            'op4->op5\n' +
            '\n' +
            '');
    });

    it('test4', () => {
        assert.equal(parseCode('function foo(x){\n' +
            '  if(x){\n' +
            'x=0;\n' +
            '}else{\n' +
            'x=1;\n' +
            '}\n' +
            '  \n' +
            '}\n','0'),
        'cond1=>condition: -1-\n' +
            'x|approved\n' +
            'op2=>operation: -2-\n' +
            'x=0;\n' +
            'op3=>operation: -3-\n' +
            'x=1;|approved\n' +
            'cond1(yes)->op2\n' +
            'cond1(no)->op3\n' +
            '');
    });
});

describe('Unit tests', () => {
    it('Create Operation Row - green', () => {
        assert.equal(createOperationRow(1,'let x=5;',true),'op1=>operation: -1-\nlet x=5;|approved'+'\n');
    });

    it('Create Operation Row - Not Green', () => {
        assert.equal(createOperationRow(1,'let x=5;',false),'op1=>operation: -1-\nlet x=5;'+'\n');
    });

    it('Create Condition Row -  Green', () => {
        assert.equal(createConditionRow(1,'x>y',true),'cond1=>condition: -1-\nx>y|approved'+'\n');
    });

    it('Create Condition Row -  Not Green', () => {
        assert.equal(createConditionRow(1,'x>y',false),'cond1=>condition: -1-\nx>y'+'\n');
    });

});


