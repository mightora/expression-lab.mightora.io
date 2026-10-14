/** Catalog examples are maintained here and shared by online and offline builds. */
export const sampleContext = {
  now: '2026-10-14T12:30:00Z',
  trigger: { body: { firstName: 'Alex', lastName: 'Morgan', email: 'alex@example.org', amount: 125.5, orderId: 'ORD-1042', status: 'Approved', tags: ['priority', 'new'], customer: { city: 'Newcastle', country: 'UK' } }, outputs: { headers: { 'Content-Type': 'application/json' }, body: { source: 'Power Apps' } } },
  actions: { Get_order: { body: { id: 1042, total: 125.5, customer: { name: 'Alex Morgan', tier: 'Gold' }, lines: [{ name: 'Book', quantity: 2 }, { name: 'Pen', quantity: 3 }] }, outputs: { statusCode: 200, body: { success: true, reference: 'REF-204' } } }, Compose: { outputs: 'Hello from Compose' } },
  variables: { environment: 'Development', retryCount: 3, isActive: true, recipients: ['alex@example.org', 'team@example.org'] },
  parameters: { vatRate: 0.2 },
  items: { Apply_to_each: { name: 'Book', quantity: 2 } },
  item: { name: 'Book', quantity: 2 }
};
export const examples = [
  { id: 'welcome', label: 'Welcome message', category: 'Strings', expression: "concat('Hello ',triggerBody()?['firstName'],'!')", description: 'Build a message from trigger data.' },
  { id: 'name', label: 'Clean and uppercase', category: 'Strings', expression: "toUpper(trim('   power automate   '))", description: 'Remove whitespace and normalise text.' },
  { id: 'replace', label: 'Replace characters', category: 'Strings', expression: "replace(toLower(triggerBody()?['email']),'@',' [at] ')", description: 'Replace a substring in an email.' },
  { id: 'split', label: 'Split an email domain', category: 'Arrays', expression: "last(split(triggerBody()?['email'],'@'))", description: 'Combine split() and last().' },
  { id: 'approvals', label: 'Approval condition', category: 'Logic', expression: "and(equals(triggerBody()?['status'],'Approved'),greater(triggerBody()?['amount'],100))", description: 'Use two conditions together.' },
  { id: 'fallback', label: 'Default missing field', category: 'Logic', expression: "coalesce(triggerBody()?['telephone'],'Not supplied')", description: 'Handle a missing or null value.' },
  { id: 'branch', label: 'If / then / else', category: 'Logic', expression: "if(greater(variables('retryCount'),2),'Escalate','Retry')", description: 'Choose a value based on a condition.' },
  { id: 'order', label: 'Read an action output', category: 'Flow data', expression: "body('Get_order')?['customer']?['name']", description: 'Safely navigate mock action data.' },
  { id: 'items', label: 'Current loop item', category: 'Flow data', expression: "concat(items('Apply_to_each')?['name'],' × ',string(items('Apply_to_each')?['quantity']))", description: 'Reference a loop item.' },
  { id: 'vat', label: 'Calculate VAT', category: 'Maths', expression: "mul(triggerBody()?['amount'],parameters('vatRate'))", description: 'Calculate from trigger data and parameters.' },
  { id: 'date', label: 'Date formatting', category: 'Dates', expression: "formatDateTime(addDays(utcNow(),7),'yyyy-MM-dd')", description: 'Format a date seven days ahead of the fixed sample clock.' },
  { id: 'json', label: 'Parse JSON string', category: 'Conversions', expression: "json('{\"id\":42,\"active\":true}')?['id']", description: 'Parse a JSON literal and access a field.' },
  { id: 'template', label: 'Text interpolation', category: 'Strings', expression: "Order @{triggerBody()?['orderId']} totals @{triggerBody()?['amount']}", description: 'Mix text and inline @{...} expressions.' },
  { id: 'array', label: 'Distinct items', category: 'Arrays', expression: "union(createArray('A','B'),createArray('B','C'))", description: 'Combine two arrays, removing duplicates.' }
];
export const catalog = [
  ['Strings', [
    ['concat',"concat('Hello ','world')",'Combine text values.'], ['toLower',"toLower('HELLO')",'Lowercase text.'], ['toUpper',"toUpper('hello')",'Uppercase text.'], ['trim',"trim('  hello  ')",'Trim whitespace.'], ['replace',"replace('red car','red','blue')",'Replace text.'], ['substring',"substring('ABCDE',1,3)",'Get part of a string.'], ['slice',"slice('ABCDE',1,4)",'Slice text or an array.'], ['split',"split('A,B,C',',')",'Split into an array.'], ['join',"join(createArray('A','B'),', ')",'Join an array.'], ['startsWith',"startsWith('Hello','He')",'Check prefix.'], ['endsWith',"endsWith('Hello','lo')",'Check suffix.'], ['indexOf',"indexOf('Hello','e')",'Find first occurrence.'], ['lastIndexOf',"lastIndexOf('banana','a')",'Find last occurrence.'], ['length',"length('hello')",'Count characters or array elements.']
  ]],
  ['Arrays', [
    ['first',"first(createArray('a','b'))",'First element.'],['last',"last(createArray('a','b'))",'Last element.'],['empty',"empty(createArray(1))",'Check for emptiness.'], ['contains',"contains(createArray(1,2),2)",'Find in string, array or object.'], ['take',"take(createArray(1,2,3),2)",'Take initial items.'],['skip',"skip(createArray(1,2,3),1)",'Skip initial items.'],['reverse',"reverse(createArray(1,2,3))",'Reverse an array or string.'], ['union',"union(createArray(1,2),createArray(2,3))",'Distinct union.'], ['intersection',"intersection(createArray(1,2),createArray(2,3))",'Common values.'], ['createArray',"createArray('a','b')",'Build an array.'],['array',"array(5)",'Convert to single-element array.']
  ]],
  ['Logic', [
    ['if',"if(equals(1,1),'yes','no')",'Conditional branching.'], ['and',"and(true,equals(2,2))",'All conditions true.'], ['or',"or(false,true)",'Any condition true.'], ['not',"not(false)",'Negate boolean.'], ['equals',"equals('a','a')",'Compare two values.'], ['greater',"greater(10,5)",'Greater than.'], ['greaterOrEquals',"greaterOrEquals(5,5)",'Greater than or equal.'], ['less',"less(1,2)",'Less than.'], ['lessOrEquals',"lessOrEquals(2,2)",'Less than or equal.'], ['coalesce',"coalesce(null,'default')",'First non-null value.']
  ]],
  ['Maths', [
    ['add',"add(2,3)",'Add numbers.'], ['sub',"sub(7,2)",'Subtract numbers.'], ['mul',"mul(3,4)",'Multiply numbers.'], ['div',"div(8,2)",'Divide numbers.'], ['mod',"mod(10,3)",'Remainder.'], ['min',"min(2,3,1)",'Smallest number.'], ['max',"max(2,3,1)",'Largest number.']
  ]],
  ['Conversions', [
    ['string',"string(123)",'Convert to text.'], ['int',"int('123')",'Convert to integer.'], ['float',"float('1.25')",'Convert to float.'], ['bool',"bool('true')",'Convert to boolean.'], ['json',"json('{\"a\":1}')",'Parse JSON.'], ['isInt',"isInt('123')",'Test integer text.'], ['isFloat',"isFloat('1.2')",'Test number text.'],['encodeUriComponent',"encodeUriComponent('hello world')",'Encode for URL.'],['decodeUriComponent',"decodeUriComponent('hello%20world')",'Decode URL encoding.']
  ]],
  ['Dates', [
    ['utcNow',"utcNow()",'Current UTC or sample context clock.'], ['formatDateTime',"formatDateTime('2026-10-14T12:00:00Z','yyyy-MM-dd')",'Limited UTC formatting.'], ['addDays',"addDays('2026-10-14T12:00:00Z',7)",'Add days.'], ['addHours',"addHours('2026-10-14T12:00:00Z',2)",'Add hours.'],['addMinutes',"addMinutes('2026-10-14T12:00:00Z',30)",'Add minutes.'],['addSeconds',"addSeconds('2026-10-14T12:00:00Z',30)",'Add seconds.'],['ticks',"ticks('2026-10-14T12:00:00Z')",'Approximate .NET ticks string.']
  ]],
  ['Flow data', [
    ['triggerBody',"triggerBody()?['firstName']",'Mock trigger body.'], ['triggerOutputs',"triggerOutputs()?['body']",'Mock trigger outputs.'], ['body',"body('Get_order')?['total']",'Action body by name.'], ['outputs',"outputs('Get_order')?['statusCode']",'Action outputs by name.'], ['variables',"variables('environment')",'Mock flow variables.'], ['parameters',"parameters('vatRate')",'Mock parameter values.'], ['items',"items('Apply_to_each')?['name']",'Named loop item.'], ['item',"item()?['name']",'Current loop item.']
  ]]
].flatMap(([category,functions]) => functions.map(([name,expression,description])=>({category,name,expression,description})));
