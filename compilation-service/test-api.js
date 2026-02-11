const { compilationService } = require('./src');

async function testPistonAPI() {
    console.log('🧪 Testing Piston API Compilation...\n');
    
    const tests = [
        {
            name: 'Python',
            code: 'print("Hello from Piston Python!")\nfor i in range(3):\n    print(f"Count: {i}")',
            language: 'python'
        },
        {
            name: 'Java',
            code: 'System.out.println("Hello from Piston Java!");\nint sum = 10 + 20;\nSystem.out.println("Sum: " + sum);',
            language: 'java'
        },
        {
            name: 'C',
            code: '#include <stdio.h>\nint main() {\n    printf("Hello from Piston C!\\n");\n    int x = 5, y = 3;\n    printf("%d * %d = %d\\n", x, y, x * y);\n    return 0;\n}',
            language: 'c'
        }
    ];
    
    let allPassed = true;
    
    for (const test of tests) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`🧪 ${test.name}`);
        console.log(`${'='.repeat(50)}`);
        console.log(`📝 Code preview: ${test.code.substring(0, 60)}...`);
        
        try {
            const startTime = Date.now();
            const result = await compilationService.compile(test.code, test.language);
            const elapsed = Date.now() - startTime;
            
            console.log(`⏱️  Time: ${elapsed}ms`);
            console.log(`✅ Success: ${result.success}`);
            console.log(`🔧 Engine: ${result.compilationEngine}`);
            
            if (result.success) {
                console.log(`📤 Output:\n${result.output}`);
                if (result.output.trim().length === 0) {
                    console.log(`⚠️  Warning: No output generated`);
                }
            } else {
                console.log(`❌ Errors: ${result.errors?.join(', ')}`);
                allPassed = false;
            }
            
            if (result.warnings && result.warnings.length > 0) {
                console.log(`⚠️  Warnings: ${result.warnings.join(', ')}`);
            }
            
        } catch (error) {
            console.log(`💥 Fatal error: ${error.message}`);
            allPassed = false;
        }
    }
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(allPassed ? '🎉 ALL TESTS PASSED!' : '❌ SOME TESTS FAILED');
    console.log(`${'='.repeat(50)}`);
    
    // Show service info
    console.log('\n📊 Service Information:');
    const info = compilationService.getServiceInfo();
    console.log(`   Name: ${info.name}`);
    console.log(`   Version: ${info.version}`);
    console.log(`   Languages: ${info.languages.join(', ')}`);
    console.log(`   Provider: ${info.provider.api}`);
}

// Run tests
testPistonAPI().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
});