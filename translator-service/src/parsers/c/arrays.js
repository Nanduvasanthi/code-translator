// src/parsers/c/arrays.js - MATCHING YOUR IMPORT PATTERN
import ParserBase from './parser-base.js';

export class ArraysParser extends ParserBase {  // ⭐ Changed from CArrayParser to ArraysParser
  constructor() {
    super('arrays');
  }

  canParse(nodeType) {
    const arrayTypes = [
      'array_declarator',
      'init_declarator',
      'subscript_expression',
      'initializer_list',
      'array_initializer'
    ];
    return arrayTypes.includes(nodeType);
  }

  parse(node, context) {
    const nodeType = node.type;
    
    console.log(`DEBUG ArraysParser: Parsing ${nodeType}`);
    
    switch (nodeType) {
      case 'array_declarator':
        return this.parseArrayDeclarator(node);
      case 'init_declarator':
        return this.parseInitDeclarator(node);
      case 'subscript_expression':
        return this.parseSubscriptExpression(node);
      case 'initializer_list':
        return this.parseInitializerList(node);
      case 'array_initializer':
        return this.parseArrayInitializer(node);
      default:
        console.log(`DEBUG ArraysParser: Unhandled node type: ${nodeType}`);
        return null;
    }
  }

  parseArrayDeclarator(node) {
    const name = this.extractNodeText(node.child(0));
    const sizeNode = node.child(1);
    let size = null;
    
    if (sizeNode && sizeNode.type === '[') {
      const sizeExpr = node.child(2);
      if (sizeExpr) {
        size = this.extractNodeText(sizeExpr);
      }
    }
    
    return {
      type: 'array_declarator',
      name: name,
      size: size,
      position: this.getPosition(node)
    };
  }

  parseInitDeclarator(node) {
    console.log(`DEBUG ArraysParser: Parsing init_declarator with ${node.childCount} children`);
    
    let declarator = null;
    let initializer = null;
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'identifier' || child.type === 'array_declarator') {
        declarator = this.extractNodeText(child);
      } else if (child.type === 'initializer_list' || child.type === 'string_literal') {
        initializer = this.parseInitializer(child);
      } else if (child.type === '=') {
        continue;
      }
    }
    
    return {
      type: 'init_declarator',
      declarator: declarator,
      initializer: initializer,
      position: this.getPosition(node)
    };
  }

  parseSubscriptExpression(node) {
    const array = this.extractNodeText(node.child(0));
    const subscriptNode = node.child(2);
    const subscript = subscriptNode ? this.extractNodeText(subscriptNode) : '';
    
    return {
      type: 'subscript_expression',
      array: array,
      subscript: subscript,
      position: this.getPosition(node)
    };
  }

  parseInitializerList(node) {
    const elements = [];
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === '{' || child.type === '}' || child.type === ',') {
        continue;
      }
      
      const element = this.parseInitializerElement(child);
      if (element) {
        elements.push(element);
      }
    }
    
    return {
      type: 'initializer_list',
      elements: elements,
      position: this.getPosition(node)
    };
  }

  parseArrayInitializer(node) {
    return this.parseInitializerList(node);
  }

  parseInitializer(node) {
    if (!node) return null;
    
    if (node.type === 'initializer_list' || node.type === 'array_initializer') {
      return this.parseInitializerList(node);
    } else if (node.type === 'string_literal') {
      const value = this.extractNodeText(node);
      return {
        type: 'string_literal',
        value: value,
        position: this.getPosition(node)
      };
    } else if (node.type === 'number_literal' || node.type === 'char_literal') {
      const value = this.extractNodeText(node);
      return {
        type: 'literal',
        value: value,
        position: this.getPosition(node)
      };
    }
    
    return null;
  }

  parseInitializerElement(node) {
    if (node.type === 'number_literal' || node.type === 'char_literal') {
      return {
        type: 'literal',
        value: this.extractNodeText(node)
      };
    } else if (node.type === 'string_literal') {
      return {
        type: 'string_literal',
        value: this.extractNodeText(node)
      };
    } else if (node.type === 'initializer_list') {
      return this.parseInitializerList(node);
    }
    
    return null;
  }

  extractNodeText(node) {
    if (!node) return '';
    
    if (node.type === 'identifier' || 
        node.type === 'number_literal' || 
        node.type === 'string_literal' ||
        node.type === 'char_literal') {
      return node.text || '';
    }
    
    return node.text || '';
  }
}