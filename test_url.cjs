const { s } = require('./dist/index.cjs');
const schema = s.string().url();

console.log('Testing URL validation:');
const test1 = schema.validate('https://example.com');
console.log('https://example.com:', test1.ok);

const test2 = schema.validate('not-a-url');
console.log('not-a-url:', test2.ok);
if (!test2.ok) {
  console.log('Error:', test2.error.issues[0]);
} else {
  console.log('BUG: not-a-url was considered valid!');
}

// Also test the regex directly
const URL_SIMPLE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
console.log('\nDirect regex test:');
console.log('not-a-url matches?', URL_SIMPLE.test('not-a-url'));
console.log('https://example.com matches?', URL_SIMPLE.test('https://example.com'));