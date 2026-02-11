// Test what the parser is actually returning
import { PrintParser } from '../src/parsers/python/print.js';

console.log('🔍 Debugging Parser Output\n');

const parser = new PrintParser();

// Mock tree-sitter node structure for print(f"Name: {name}")
const mockNode = {
  type: 'call',
  childCount: 3,
  child: function(i) {
    const children = [
      { type: 'identifier', text: 'print' },
      { type: '(', text: '(' },
      { 
        type: 'argument_list',
        childCount: 3,
        child: function(j) {
          const args = [
            { type: '(', text: '(' },
            { 
              type: 'call',
              childCount: 2,
              child: function(k) {
                const fchildren = [
                  { type: 'identifier', text: 'f' },
                  { type: 'string', text: 'f"Name: {name}"' }
                ];
                return fchildren[k];
              }
            },
            { type: ')', text: ')' }
          ];
          return args[j];
        }
      }
    ];
    return children[i];
  }
};

console.log('Testing parser.canParse(mockNode):', parser.canParse(mockNode));

if (parser.canParse(mockNode)) {
  const result = parser.parse(mockNode);
  console.log('\nParser result:', JSON.stringify(result, null, 2));
  
  if (result.args && result.args.length > 0) {
    console.log('\nFirst argument:');
    console.log('  type:', result.args[0].type);
    console.log('  value:', result.args[0].value);
    
    // Check if value still has 'f' in it
    if (result.args[0].value.includes('f"')) {
      console.log('❌ PROBLEM: Value still contains f"');
      console.log('   This means extractFStringValue is not working correctly');
    }
  }
}