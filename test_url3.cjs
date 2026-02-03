const { s } = require('./dist/index.cjs');
const { validateRegexSecurity } = require('./dist/index.cjs');

const schema = s.string().url();
const pattern = schema.config.pattern;
const testValue = 'not-a-url';

console.log('Testing validateRegexSecurity directly:');
const validation = validateRegexSecurity(pattern, testValue);
console.log('Validation result:', validation);
console.log('Valid?', validation.valid);
console.log('Result?', validation.result);

// Also test with a valid URL
const validValidation = validateRegexSecurity(pattern, 'https://example.com');
console.log('\nValid URL validation:', validValidation);