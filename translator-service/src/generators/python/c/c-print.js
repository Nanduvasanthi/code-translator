import { PrintStatement } from '../../../core/ast-nodes.js';

export class PrintGenerator {
  canGenerate(astNode) {
    return astNode.type === 'print_statement';
  }

  generate(astNode, context) {
    const { args } = astNode;
    
    if (!args || args.length === 0) {
      return 'print()';
    }
    
    // Convert printf format string and arguments to Python print
    return this.convertPrintfCall(args, context);
  }

  convertPrintfCall(args, context) {
    if (!args || args.length === 0) {
      return 'print()';
    }
    
    const firstArg = args[0];
    let formatString = '';
    let originalFormat = '';
    
    // Extract format string from first argument
    if (typeof firstArg === 'object') {
      if (firstArg.type === 'literal' || firstArg.type === 'string_literal') {
        formatString = firstArg.value || '';
        originalFormat = firstArg.originalFormat || formatString;
      } else if (firstArg.value) {
        formatString = firstArg.value;
        originalFormat = formatString;
      }
    } else if (typeof firstArg === 'string') {
      formatString = firstArg;
      originalFormat = formatString;
    }
    
    console.log(`DEBUG PrintGenerator: formatString = "${formatString}", originalFormat = "${originalFormat}"`);
    
    const formatArgs = args.slice(1);
    
    if (formatArgs.length === 0) {
      // No arguments, simple print
      const pythonFormat = this.formatStringValue(formatString);
      return `print(${pythonFormat})`;
    }
    
    // Convert arguments to Python expressions
    const pyArgs = formatArgs.map(arg => {
      return this.convertExpression(arg, context);
    });
    
    console.log(`DEBUG PrintGenerator: pyArgs =`, pyArgs);
    
    // Check if original format has placeholders
    const hasPlaceholders = originalFormat.includes('%');
    
    if (!hasPlaceholders) {
      // No format specifiers in original, use Python's print with multiple arguments
      // But first, check if the cleaned format string is just whitespace
      if (formatString.trim() === '' && originalFormat.includes('%')) {
        // Special case: format was something like "%d" which got cleaned to ""
        // Use string formatting
        const pyFormat = this.formatStringValue(this.convertCFormatToPython(originalFormat));
        const argsStr = pyArgs.join(', ');
        return `print(${pyFormat}.format(${argsStr}))`;
      } else {
        // Normal case: print with multiple arguments
        const pythonFormat = this.formatStringValue(formatString);
        const allArgs = [pythonFormat, ...pyArgs];
        return `print(${allArgs.join(', ')})`;
      }
    } else {
      // Has format specifiers, use string formatting
      // Convert C format to Python format
      let pyFormat = this.convertCFormatToPython(originalFormat);
      pyFormat = this.formatStringValue(pyFormat);
      
      console.log(`DEBUG PrintGenerator: pyFormat = "${pyFormat}"`);
      
      if (pyArgs.length > 0) {
        const argsStr = pyArgs.join(', ');
        return `print(${pyFormat}.format(${argsStr}))`;
      } else {
        return `print(${pyFormat})`;
      }
    }
  }

  convertExpression(expr, context) {
  if (typeof expr === 'object') {
    // Check if we have an OperatorsGenerator in context
    const generators = context?.generators || {};
    const operatorsGenerator = generators.operators;
    
    if (operatorsGenerator && operatorsGenerator.canGenerate && 
        operatorsGenerator.canGenerate(expr)) {
      return operatorsGenerator.generate(expr, context);
    }
    
    // ADD THIS: Handle array access expressions
    if (expr.type === 'array_access' || expr.type === 'subscript_expression') {
      return this.generateArrayAccess(expr, context);
    }
    
    // Fallback: handle basic types
    if (expr.type === 'identifier') {
      return expr.name || expr.value || '';
    } else if (expr.type === 'literal') {
      return expr.value || '';
    } else if (expr.type === 'expression') {
      return expr.value || '';
    }
    
    // Try to convert expression to string
    return JSON.stringify(expr);
  }
  
  return expr;
}

// ADD THIS NEW METHOD
generateArrayAccess(astNode, context) {
  const { array, index, value } = astNode;
  
  // If we have a direct value (like "numbers[0]"), use it
  if (value) {
    // Clean up the value if it's a JSON string
    if (typeof value === 'string' && value.startsWith('{')) {
      try {
        const parsed = JSON.parse(value);
        return this.generateArrayAccess(parsed, context);
      } catch (e) {
        return value;
      }
    }
    return value;
  }
  
  // Otherwise construct array access from array and index
  let arrayName;
  if (typeof array === 'object') {
    if (array.type === 'identifier') {
      arrayName = array.name || array.value;
    } else if (array.type === 'subscript_expression' || array.type === 'array_access') {
      // Handle multi-dimensional arrays: matrix[1][2]
      arrayName = this.generateArrayAccess(array, context);
    } else {
      arrayName = array.value || array.text || 'unknown';
    }
  } else {
    arrayName = array;
  }
  
  let indexValue;
  if (typeof index === 'object') {
    if (index.type === 'literal') {
      indexValue = index.value;
    } else if (index.type === 'identifier') {
      indexValue = index.name || index.value;
    } else {
      indexValue = index.value || index.text || '0';
    }
  } else {
    indexValue = index;
  }
  
  return `${arrayName}[${indexValue}]`;
}

  formatStringValue(value) {
    if (typeof value === 'string') {
      // Check if the value already has quotes
      const hasQuotes = (value.startsWith('"') && value.endsWith('"')) || 
                       (value.startsWith("'") && value.endsWith("'"));
      
      if (hasQuotes) {
        // Remove existing quotes, escape, and re-add Python quotes
        let unquoted = value;
        if (value.startsWith('"') && value.endsWith('"')) {
          unquoted = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          unquoted = value.substring(1, value.length - 1);
        }
        
        // Escape for Python
        let escaped = unquoted
          .replace(/\\"/g, '"')  // Unescape C escaped quotes
          .replace(/"/g, '\\"')  // Escape for Python
          .replace(/'/g, "\\'")
          .replace(/\\n/g, '\\\\n')
          .replace(/\\t/g, '\\\\t');
        
        return `"${escaped}"`;
      } else {
        // No quotes - treat as raw string and add quotes
        // Escape for Python
        let escaped = value
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'")
          .replace(/\n/g, '\\\\n')
          .replace(/\t/g, '\\\\t');
        
        return `"${escaped}"`;
      }
    }
    return JSON.stringify(value);
  }

  convertCFormatToPython(formatStr) {
    if (!formatStr) return '';
    
    console.log(`DEBUG PrintGenerator.convertCFormatToPython: Input = "${formatStr}"`);
    
    // Remove trailing \n since Python's print() adds it automatically
    let result = formatStr;
    if (result.endsWith('\\n')) {
      result = result.substring(0, result.length - 2);
    }
    
    // Convert C format specifiers to Python placeholders
    // Handle escaped percent signs first
    result = result.replace(/%%/g, '§§PERCENT§§');
    
    // Convert ALL format specifiers with various flags
    const formatSpecifierRegex = /%[-+#0 ]*\d*(?:\.\d+)?(?:[hlLztj])?[diuoxXfFeEgGaAcspn]/g;
    
    // Replace all format specifiers with {}
    result = result.replace(formatSpecifierRegex, '{}');
    
    // Also handle specific cases that might have been missed
    result = result.replace(/%hd/g, '{}');
    result = result.replace(/%ld/g, '{}');
    result = result.replace(/%lld/g, '{}');
    result = result.replace(/%hu/g, '{}');
    result = result.replace(/%lu/g, '{}');
    result = result.replace(/%llu/g, '{}');
    result = result.replace(/%Lf/g, '{}');
    result = result.replace(/%Le/g, '{}');
    result = result.replace(/%Lg/g, '{}');
    
    // Handle precision specifiers separately
    result = result.replace(/%.\d+Lf/g, '{}');
    result = result.replace(/%.\d+Le/g, '{}');
    result = result.replace(/%.\d+Lg/g, '{}');
    
    // Restore literal percent signs
    result = result.replace(/§§PERCENT§§/g, '%');
    
    console.log(`DEBUG PrintGenerator.convertCFormatToPython: Result = "${result}"`);
    
    return result;
  }
}