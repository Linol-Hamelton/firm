const { s, StringValidator } = require('./dist/index.cjs');
const schema = s.string().url();

console.log('Schema config:', schema.config);
console.log('Schema has pattern?', !!schema.config.pattern);
console.log('Pattern:', schema.config.pattern);

// Check internal validation
const validator = schema;
console.log('\nValidator type:', validator._type);

// Manually test validation
const testValue = 'not-a-url';
console.log('\nManual validation of:', testValue);
const result = validator.validate(testValue);
console.log('Result:', result);

// Check if pattern is being used
if (schema.config.pattern) {
  console.log('\nDirect pattern test:');
  console.log('Pattern matches?', schema.config.pattern.test(testValue));
}