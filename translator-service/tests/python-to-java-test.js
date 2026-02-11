import { PythonToJavaTranslator } from '../src/translators/python-to-java/index.js';

console.log('🧪 Testing Python to Java Translator\n');

const translator = new PythonToJavaTranslator();

// Test the problematic f-string case
const testCode = `# Basic Python Example
print("Hello, World!")

name = "Alice"
age = 25

print(f"Name: {name}")
print(f"Age: {age}")`;

console.log('📝 Python Input:');
console.log(testCode);
console.log('\n' + '='.repeat(60) + '\n');

try {
  const result = translator.translate(testCode);
  console.log('💻 Java Output:');
  console.log(result);
  
  // Debug: Check what's in the output
  console.log('\n🔍 Debug Analysis:');
  console.log('1. Contains "f\\"" in output?', result.includes('f"'));
  console.log('2. Contains "Name: " + name?', result.includes('"Name: " + name'));
  console.log('3. Contains "Age: " + age?', result.includes('"Age: " + age'));
  
  // Show the actual print lines
  const lines = result.split('\n');
  console.log('\n📄 Print lines in output:');
  lines.forEach((line, i) => {
    if (line.includes('System.out.println')) {
      console.log(`  Line ${i}: ${line.trim()}`);
    }
  });
  
} catch (error) {
  console.error('💥 Translation error:', error.message);
  console.error('Stack:', error.stack);
}