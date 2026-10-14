import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateExpression as evaluate, ExpressionError} from '../src/engine.mjs';
import {sampleContext, examples, catalog} from '../src/catalog.mjs';
const ctx=sampleContext;
function fails(expression,pattern){assert.throws(()=>evaluate(expression,ctx),pattern);}
test('literals, strings and escapes',()=>{
  assert.equal(evaluate("'Hello'"),'Hello');assert.equal(evaluate("'it''s fine'"),"it's fine");
  assert.equal(evaluate('true'),true);assert.equal(evaluate('null'),null);assert.equal(evaluate('-2.5'),-2.5);
});
test('nested strings and templates',()=>{
  assert.equal(evaluate("concat('Hello ',toUpper('world'))"),'Hello WORLD');
  assert.equal(evaluate("@concat('A', 'B')"),'AB');
  assert.equal(evaluate("Ref @{triggerBody()?['orderId']}, @{add(1,2)}",ctx),'Ref ORD-1042, 3');
  assert.equal(evaluate("trim(' abc ')",ctx),'abc');
});
test('flow data and safe access',()=>{
  assert.equal(evaluate("triggerBody()?['customer']?['city']",ctx),'Newcastle');
  assert.equal(evaluate("triggerBody()?['missing']",ctx),null);
  assert.equal(evaluate("body('Get_order')?['lines'][1]?['quantity']",ctx),3);
  assert.equal(evaluate("outputs('Get_order')?['statusCode']",ctx),200);
  assert.equal(evaluate("variables('environment')",ctx),'Development');
  assert.equal(evaluate("parameters('vatRate')",ctx),0.2);
  assert.equal(evaluate("item()?['name']",ctx),'Book');
  assert.equal(evaluate("items('Apply_to_each')?['quantity']",ctx),2);
});
test('maths and conditionals',()=>{
  assert.equal(evaluate('add(2,mul(3,4))'),14);
  assert.equal(evaluate('div(7,2)'),3);
  assert.equal(evaluate('mod(7,2)'),1);
  assert.equal(evaluate("if(and(true,equals('A','A')),'yes',div(1,0))",ctx),'yes');
  assert.equal(evaluate("if(false,div(1,0),'safe')",ctx),'safe');
  assert.equal(evaluate('or(true,div(1,0))',ctx),true);
  assert.equal(evaluate('coalesce(null,0,42)',ctx),0);
});
test('arrays and object conversions',()=>{
  assert.deepEqual(evaluate('createArray(1,2,3)'),[1,2,3]);
  assert.deepEqual(evaluate('union(createArray(1,2),createArray(2,3))'),[1,2,3]);
  assert.deepEqual(evaluate('intersection(createArray(1,2),createArray(2,3))'),[2]);
  assert.equal(evaluate("json('{\"name\":\"Ada\"}')?['name']"),'Ada');
  assert.equal(evaluate("last(split('a@example.org','@'))"),'example.org');
});
test('dates support fixed UTC context and limited documented formats',()=>{
  assert.equal(evaluate("formatDateTime(addDays(utcNow(),7),'yyyy-MM-dd')",ctx),'2026-10-21');
  assert.equal(evaluate("formatDateTime('2026-01-02T03:04:05Z','yyyy-MM-dd HH:mm:ss')",ctx),'2026-01-02 03:04:05');
  fails("formatDateTime('2026-01-02','dddd')",/not supported/);
});
test('blocks non-language input and unbounded abuse',()=>{
  fails("process.exit(1)",/Unknown identifier|Unexpected trailing/);
  fails('eval(1)',/not supported/);
  fails("triggerBody()?['__proto__']",/not available/);
  fails("triggerBody()?['constructor']",/not available/);
  fails('div(3,0)',/Division by zero/);
  fails("substring('abc',1,10)",/outside/);
  fails('foo(1)',/not supported/);
  fails("concat('broken)",/Unclosed string/);
  fails('x'.repeat(50001),/too long/);
});
test('all curated examples and catalog recipes evaluate',()=>{
  for(const example of examples){assert.doesNotThrow(()=>evaluate(example.expression,ctx),`sample ${example.id}: ${example.expression}`);}
  for(const entry of catalog){assert.doesNotThrow(()=>evaluate(entry.expression,ctx),`catalog ${entry.name}: ${entry.expression}`);}
  assert.ok(catalog.length>=60);
});
