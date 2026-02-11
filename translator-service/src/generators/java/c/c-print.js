// generators/java/c-print.js - COMPLETE FIXED VERSION
import { CJavaGeneratorBase } from './c-generator-base.js';

export class CPrintGenerator extends CJavaGeneratorBase {
  constructor() {
    super();
  }

  generate(astNode, context = {}, visitor) {
    const indentLevel = context.indentLevel || 0;
    const indent = '    '.repeat(indentLevel);
    
    if (!astNode.args || astNode.args.length === 0) {
      return indent + 'System.out.println();';
    }
    
    // Check if this is a simple newline print
    if (astNode.args.length === 1 && 
        astNode.args[0].type === 'literal' && 
        astNode.args[0].data_type === 'String' &&
        astNode.args[0].value === '') {
      return indent + 'System.out.println();';
    }
    
    // Check if this is sequential printing (like printf("%d ", i))
    const isSequentialPrint = this.isSequentialPrint(astNode.args);
    
    // Determine whether to use print() or println()
    const methodName = isSequentialPrint ? 'System.out.print(' : 'System.out.println(';
    
    // Convert printf format string to Java string concatenation
    let output = methodName;
    output += this.convertPrintfToJava(astNode.args, visitor, isSequentialPrint);
    output += ');';
    
    return indent + output;
  }

  isSequentialPrint(args) {
    // Check if this is something like printf("%d ", i) for sequential printing
    if (args.length !== 2) return false;
    
    const formatString = args[0];
    if (formatString.type !== 'literal' || formatString.data_type !== 'String') {
      return false;
    }
    
    // Check original format string for patterns like "%d " or just "%d"
    const originalFormat = formatString.originalFormat || '';
    
    console.log(`DEBUG isSequentialPrint: Checking original format: "${originalFormat}"`);
    
    // Check if it's a simple format specifier like %d, %d, %f, etc.
    const isSimpleFormatSpecifier = /^%[-+#0 ]*\d*(?:\.\d+)?(?:[hlLztj])?[diuoxXfFeEgGaAcspn]\s*$/.test(originalFormat);
    
    // Also check if cleaned format is empty or just a space
    const isEmptyOrSpace = formatString.value === '' || formatString.value === ' ' || formatString.value === '\\n';
    
    console.log(`DEBUG isSequentialPrint: isSimpleFormatSpecifier=${isSimpleFormatSpecifier}, isEmptyOrSpace=${isEmptyOrSpace}, value="${formatString.value}"`);
    
    // It's sequential printing if it's a simple format specifier and cleaned to empty/space
    return isSimpleFormatSpecifier && isEmptyOrSpace;
  }

  convertPrintfToJava(args, visitor, isSequentialPrint = false) {
    if (args.length === 0) return '""';
    
    const formatString = args[0];
    const formatArgs = args.slice(1);
    
    // Get the format text (already cleaned by parser)
    let formatText = '';
    if (formatString.type === 'literal' && formatString.data_type === 'String') {
      formatText = formatString.value;
    } else {
      return '""';
    }
    
    console.log(`DEBUG CPrintGenerator: Format string: "${formatText}" with ${formatArgs.length} args, isSequentialPrint: ${isSequentialPrint}`);
    
    // Special handling for sequential printing
    if (isSequentialPrint && formatArgs.length === 1) {
      const arg = this.generateArg(formatArgs[0], visitor);
      const originalFormat = formatString.originalFormat || '';
      
      // Check if original ends with space
      const hadSpaceAfterSpecifier = originalFormat.endsWith(' ');
      
      console.log(`DEBUG CPrintGenerator: Sequential print - original: "${originalFormat}", hadSpaceAfterSpecifier: ${hadSpaceAfterSpecifier}`);
      
      if (hadSpaceAfterSpecifier) {
        return `${arg} + " "`;
      } else {
        return arg;
      }
    }
    
    // If we have the original format string, use it for better reconstruction
    const originalFormat = formatString.originalFormat || formatText;
    
    // Parse the original format string to understand the structure
    const parts = this.parseOriginalFormat(originalFormat, formatArgs, visitor, isSequentialPrint);
    
    // Handle special cases for empty format with single argument
    if (parts.length === 0 && formatArgs.length === 1) {
      const arg = this.generateArg(formatArgs[0], visitor);
      return arg;
    }
    
    // Join parts
    if (parts.length === 0) return '""';
    if (parts.length === 1) return parts[0];
    
    return parts.join(' + ');
  }

  parseOriginalFormat(originalFormat, formatArgs, visitor, isSequentialPrint) {
    const parts = [];
    let currentIndex = 0;
    let argIndex = 0;
    
    // Handle escaped percent signs first
    let tempFormat = originalFormat.replace(/%%/g, '§§PERCENT§§');
    
    // Check if this is a header with newline
    const isHeaderWithNewline = !isSequentialPrint && originalFormat.includes(':') && originalFormat.endsWith('\\n');
    
    // Remove trailing \n if present (but keep for headers)
    if (tempFormat.endsWith('\\n') && !isHeaderWithNewline) {
      tempFormat = tempFormat.substring(0, tempFormat.length - 2);
    }
    
    while (currentIndex < tempFormat.length) {
      // Look for format specifier
      const percentIndex = tempFormat.indexOf('%', currentIndex);
      
      if (percentIndex === -1) {
        // No more format specifiers, add remaining text
        const remainingText = tempFormat.substring(currentIndex);
        const processedText = this.processTextForJava(remainingText, isSequentialPrint, isHeaderWithNewline);
        if (processedText !== '') {
          parts.push(`"${processedText}"`);
        }
        break;
      }
      
      // Add text before the format specifier
      const textBefore = tempFormat.substring(currentIndex, percentIndex);
      const processedBefore = this.processTextForJava(textBefore, isSequentialPrint, isHeaderWithNewline);
      if (processedBefore !== '') {
        parts.push(`"${processedBefore}"`);
      }
      
      // Parse the format specifier
      let specifierEnd = percentIndex + 1;
      while (specifierEnd < tempFormat.length && 
             !/[diuoxXfFeEgGaAcspn]/.test(tempFormat[specifierEnd])) {
        specifierEnd++;
      }
      
      if (specifierEnd < tempFormat.length) {
        // We found a valid specifier
        specifierEnd++; // Include the specifier character
        
        // Get the argument for this specifier
        if (argIndex < formatArgs.length) {
          const arg = formatArgs[argIndex];
          const generatedArg = this.generateArg(arg, visitor);
          
          // Check if we need to add space after the argument
          // Look at the character after the format specifier
          if (specifierEnd < tempFormat.length && tempFormat[specifierEnd] === ' ') {
            // Format specifier followed by space (e.g., "%d ")
            // Add space after the argument
            parts.push(`(${generatedArg}) + " "`);
            specifierEnd++; // Skip the space
          } else {
            // Add argument with parentheses if needed
            if (this.isExpressionNeedingParentheses(arg)) {
              parts.push(`(${generatedArg})`);
            } else {
              parts.push(generatedArg);
            }
          }
          
          argIndex++;
        } else {
          // Missing argument, just add empty string
          parts.push('""');
        }
        
        currentIndex = specifierEnd;
      } else {
        // Not a valid format specifier
        currentIndex = percentIndex + 1;
      }
    }
    
    // Add any leftover arguments
    while (argIndex < formatArgs.length) {
      const arg = formatArgs[argIndex];
      const generatedArg = this.generateArg(arg, visitor);
      
      if (this.isExpressionNeedingParentheses(arg)) {
        parts.push(`(${generatedArg})`);
      } else {
        parts.push(generatedArg);
      }
      
      argIndex++;
    }
    
    return parts;
  }

  processTextForJava(text, isSequentialPrint = false, isHeaderWithNewline = false) {
    if (!text) return '';
    
    // Convert C escape sequences to Java string literals
    let result = text;
    
    // Restore percent signs
    result = result.replace(/§§PERCENT§§/g, '%');
    
    // Handle escape sequences for Java
    if (result.endsWith('\\n') && !isSequentialPrint) {
      result = result.substring(0, result.length - 2);
    }
    
    // Convert escape sequences
    result = result
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\\\/g, '\\\\')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, '\'');
    
    // Now escape special characters for Java string literal
    result = result
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t')
      .replace(/\r/g, '\\r');
    
    // Add space after colon for headers
    if (!isSequentialPrint && !isHeaderWithNewline) {
      if (result.endsWith(':') && !result.endsWith(':\\n')) {
        result = result + ' ';
      } else if (result.endsWith('=')) {
        result = result + ' ';
      }
    }
    
    return result;
  }

  generateArg(arg, visitor) {
    if (!arg) return '""';
    
    if (arg.type === 'literal') {
      if (arg.data_type === 'String') {
        return `"${this.processTextForJava(arg.value)}"`;
      }
      return arg.value;
    } else if (arg.type === 'identifier') {
      return arg.name;
    } else if (arg.type === 'array_access') {
      // ⭐⭐ CRITICAL FIX: Handle array access expressions
      const arrayName = arg.array || arg.value?.split('[')[0] || '';
      const index = arg.index || '';
      return `${arrayName}[${index}]`;
    } else if (arg.type === 'binary_expression' || 
               arg.type === 'comparison_expression' ||
               arg.type === 'logical_expression' ||
               arg.type === 'unary_expression' ||
               arg.type === 'expression' ||
               arg.type === 'bitwise_expression' ||
               arg.type === 'assignment_expression') {
      // Use the operators generator
      if (visitor.generators?.operators) {
        const gen = visitor.generators.operators;
        let generated = '';
        
        if (typeof gen === 'function') {
          generated = gen(arg, {}, visitor);
        } else if (gen.generate && typeof gen.generate === 'function') {
          generated = gen.generate(arg, {}, visitor);
        } else if (gen.default && gen.default.generate && typeof gen.default.generate === 'function') {
          generated = gen.default.generate(arg, {}, visitor);
        }
        
        if (!generated && arg.value) {
          generated = arg.value;
        }
        
        if (!generated && arg.name) {
          generated = arg.name;
        }
        
        return generated || '""';
      }
      
      // Fallback
      if (arg.value) return arg.value;
      if (arg.name) return arg.name;
      return '""';
    }
    
    return '""';
  }

  isExpressionNeedingParentheses(expr) {
    if (!expr) return false;
    
    const needsParenthesesTypes = [
      'binary_expression',
      'comparison_expression',
      'logical_expression',
      'bitwise_expression',
      'unary_expression',
      'assignment_expression'
    ];
    
    return needsParenthesesTypes.includes(expr.type);
  }
}

export default {
  generate: function(node, context, visitor) {
    const generator = new CPrintGenerator();
    return generator.generate(node, context, visitor);
  }
};