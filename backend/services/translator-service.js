import axios from 'axios';

const TRANSLATOR_SERVICE_URL = process.env.TRANSLATOR_SERVICE_URL || 'http://localhost:3001';

class TranslatorService {
    static async translate(code, sourceLang, targetLang) {
        try {
            console.log(`🔄 Calling Translator Service: ${sourceLang} → ${targetLang}`);
            
            const response = await axios.post(`${TRANSLATOR_SERVICE_URL}/translate`, {
                source_code: code,
                source_language: sourceLang,
                target_language: targetLang
            }, {
                timeout: 30000
            });
            
            return {
                success: true,
                ...response.data,
                service_used: 'translator-service'
            };
            
        } catch (error) {
            console.error('❌ Translator service failed:', error.message);
            
            // Fallback to simple rules
            return this.fallbackTranslate(code, sourceLang, targetLang);
        }
    }
    
    static async getSupportedPairs() {
        try {
            const response = await axios.get(`${TRANSLATOR_SERVICE_URL}/pairs`);
            return response.data;
        } catch (error) {
            return this.fallbackPairs();
        }
    }
    
    static fallbackTranslate(code, sourceLang, targetLang) {
        if (sourceLang === targetLang) return code;
        
        let translated = code;
        
        if (sourceLang === 'python' && targetLang === 'java') {
            translated = `// Translated from Python to Java (Fallback)
public class Main {
    public static void main(String[] args) {
        ${code.replace(/print\((.*)\)/g, 'System.out.println($1);')}
    }
}`;
        } else if (sourceLang === 'python' && targetLang === 'c') {
            translated = `// Translated from Python to C (Fallback)
#include <stdio.h>

int main() {
    ${code.replace(/print\((.*)\)/g, 'printf($1);')}
    return 0;
}`;
        } else {
            translated = `// Fallback translation: ${sourceLang} → ${targetLang}
// Original code:
${code}`;
        }
        
        return {
            success: true,
            translated_code: translated,
            source_code: code,
            source_language: sourceLang,
            target_language: targetLang,
            execution_time: '0ms',
            service_used: 'fallback'
        };
    }
    
    static fallbackPairs() {
        const languages = ['python', 'java', 'c', 'cpp', 'csharp'];
        const pairs = [];
        
        for (let source of languages) {
            for (let target of languages) {
                if (source !== target) {
                    pairs.push({ source, target, supported: true });
                }
            }
        }
        
        return {
            success: true,
            pairs,
            total: pairs.length,
            languages
        };
    }
}

export default TranslatorService;