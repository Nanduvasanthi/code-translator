// c-comments.js - Make sure it handles all comment types
export class CCommentGenerator {
  generate(astNode, context, visitor) {
    const commentText = astNode.text || '';
    
    // Handle C-style comments
    if (commentText.startsWith('//')) {
      return commentText; // Already Java-style
    }
    
    // Handle C-style block comments /* ... */
    if (commentText.startsWith('/*')) {
      // Convert to Java single line comments or keep as multi-line
      const lines = commentText.split('\n');
      if (lines.length === 1) {
        // Single line block comment
        const content = commentText.replace(/^\/\*\s*/, '').replace(/\s*\*\/$/, '');
        return `// ${content.trim()}`;
      } else {
        // Multi-line comment
        return `/*${commentText.substring(2, commentText.length - 2)}*/`;
      }
    }
    
    // Handle Python-style comments for translation
    if (commentText.startsWith('#')) {
      return `// ${commentText.substring(1).trim()}`;
    }
    
    // Default
    return `// ${commentText}`;
  }
}

export default {
  generate: function(node, context, visitor) {
    const generator = new CCommentGenerator();
    return generator.generate(node, context, visitor);
  }
};