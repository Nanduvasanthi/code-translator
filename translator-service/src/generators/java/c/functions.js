// generators/java/functions.js - SIMPLE VERSION
export class FunctionGenerator {
  generate(astNode, context, visitor) {
    // For function_declaration nodes, return empty
    // The visitor will handle class/method wrapping
    if (astNode.type === 'function_declaration') {
      return '';
    }
    
    // Handle return statements
    if (astNode.type === 'return_statement') {
      // Skip return 0 in main function
      if (astNode.value && astNode.value.type === 'literal' && astNode.value.value === 0) {
        return '';
      }
      return `return ${astNode.value?.value || ''};`;
    }
    
    return '';
  }
}

export default {
  generate: function(node, context, visitor) {
    const generator = new FunctionGenerator();
    return generator.generate(node, context, visitor);
  }
};

// Also export as named function
export function generate(node, context, visitor) {
  const generator = new FunctionGenerator();
  return generator.generate(node, context, visitor);
}