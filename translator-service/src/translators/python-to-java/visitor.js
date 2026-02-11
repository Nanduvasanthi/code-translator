export class ASTVisitor {
  constructor(context, parsers, generators) {
    this.context = context;
    this.parsers = parsers;
    this.generators = generators;
    this.output = [];
    this.processedNodes = new Set();
  }

  visit(node) {
    if (!node) return '';
    
    // Skip already processed nodes
    const nodeId = `${node.type}:${node.startPosition.row}:${node.startPosition.column}`;
    if (this.processedNodes.has(nodeId)) {
      return '';
    }
    this.processedNodes.add(nodeId);
    
    // Handle expression_statement wrapper
    if (node.type === 'expression_statement') {
      // Process the first non-empty child
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child.type !== '\n' && child.type !== '') {
          return this.visit(child);
        }
      }
      return '';
    }
    
    // Skip punctuation and string parts
    const skipTypes = ['(', ')', '=', ':', '\n', '', 'string_start', 'string_end', 'string_content', 'argument_list'];
    if (skipTypes.includes(node.type)) {
      return '';
    }
    
    // Try to parse the node
    for (const parser of this.parsers) {
      if (parser.canParse(node)) {
        const astNode = parser.parse(node, this.context);
        
        for (const generator of this.generators) {
          if (generator.canGenerate(astNode)) {
            return generator.generate(astNode, this.context);
          }
        }
        break;
      }
    }
    
    return '';
  }

  addLine(line) {
    // Don't add duplicate consecutive empty lines
    if (line.trim() === '') {
      if (this.output.length > 0 && this.output[this.output.length - 1].trim() === '') {
        return;
      }
    }
    
    this.output.push(line);
  }

  getOutput() {
    return this.output.join('\n');
  }
}