/**
 * Ant Coffee & Tea - Component Architecture & Export Integrity Test
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    passedTests++;
    console.log(`✅ PASS: ${message}`);
  }
}

function parseModule(relativeFilePath) {
  const fullPath = path.resolve(__dirname, relativeFilePath);
  assert(fs.existsSync(fullPath), `File exists: ${relativeFilePath}`);
  const code = fs.readFileSync(fullPath, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'flow', 'classProperties'],
    });
    assert(true, `Syntax & AST valid: ${relativeFilePath}`);
  } catch (err) {
    assert(false, `Syntax error in ${relativeFilePath}: ${err.message}`);
    return { code, ast: null, exports: [] };
  }

  const exportNames = [];
  ast.program.body.forEach((node) => {
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration) {
        if (node.declaration.declarations) {
          node.declaration.declarations.forEach((d) => exportNames.push(d.id.name));
        } else if (node.declaration.id) {
          exportNames.push(node.declaration.id.name);
        }
      }
    } else if (node.type === 'ExportDefaultDeclaration') {
      exportNames.push('default');
    }
  });

  return { code, ast, exports: exportNames };
}

console.log('====================================================');
console.log('ANT COFFEE & TEA — COMPONENT INTEGRITY TEST');
console.log('====================================================\n');

try {
  // Test theme tokens
  console.log('--- TEST GROUP 1: THEME & TOKENS ---');
  const theme = parseModule('../src/theme/theme.js');
  assert(theme.exports.includes('COLORS'), 'theme.js exports COLORS');
  assert(theme.exports.includes('GLASS'), 'theme.js exports GLASS');
  assert(theme.exports.includes('SHADOWS'), 'theme.js exports SHADOWS');
  assert(theme.exports.includes('RADIUS'), 'theme.js exports RADIUS');
  assert(theme.exports.includes('TYPOGRAPHY'), 'theme.js exports TYPOGRAPHY');
  assert(theme.code.includes('#7E22CE'), 'theme.js defines Royal Purple #7E22CE');
  assert(theme.code.includes('#FF6B00'), 'theme.js defines Citrus Orange #FF6B00');

  const motion = parseModule('../src/theme/motion.js');
  assert(motion.exports.includes('MOTION'), 'motion.js exports MOTION');

  // Test Liquid Glass Core Component
  console.log('\n--- TEST GROUP 2: LIQUID GLASS COMPONENT ---');
  const glassView = parseModule('../src/components/common/GlassView.js');
  assert(glassView.exports.includes('default'), 'GlassView exports default component');
  assert(glassView.code.includes('backdropFilter'), 'GlassView contains backdropFilter web blur');

  // Test common design system components
  console.log('\n--- TEST GROUP 3: COMMON DESIGN SYSTEM ---');
  const commonComponents = [
    'Button.js',
    'IconButton.js',
    'Input.js',
    'Badge.js',
    'KPICard.js',
    'SectionHeader.js',
    'QuantityStepper.js',
    'OfflineBanner.js',
    'ErrorState.js',
    'OrderCard.js',
    'AppModal.js',
    'ConfirmDialog.js',
    'Toast.js',
  ];

  commonComponents.forEach((comp) => {
    const mod = parseModule(`../src/components/common/${comp}`);
    assert(mod.ast !== null, `common/${comp} compiles without errors`);
  });

  // Test core app components
  console.log('\n--- TEST GROUP 4: TALABAT & APP SCREENS ---');
  const appComponents = [
    'Header.js',
    'FloatingBottomNav.js',
    'ProductCard.js',
    'ProductDetailModal.js',
    'CartModal.js',
    'OrderSuccessModal.js',
    'OrderTrackingModal.js',
    'AddressModal.js',
    'SearchModal.js',
    'StaffView.js',
    'OwnerView.js',
    'LoginModal.js',
  ];

  appComponents.forEach((comp) => {
    const mod = parseModule(`../src/components/${comp}`);
    assert(mod.exports.includes('default'), `${comp} exports default component`);
  });

  // Test Root App
  console.log('\n--- TEST GROUP 5: ROOT APP INTEGRATION ---');
  const rootApp = parseModule('../App.js');
  assert(rootApp.exports.includes('default'), 'App.js exports default component');
  assert(rootApp.code.includes('FloatingBottomNav'), 'App.js embeds FloatingBottomNav');
  assert(rootApp.code.includes('Header'), 'App.js embeds Header');
  assert(rootApp.code.includes('ProductCard'), 'App.js embeds ProductCard');
  assert(rootApp.code.includes('ProductDetailModal'), 'App.js embeds ProductDetailModal');
  assert(rootApp.code.includes('CartModal'), 'App.js embeds CartModal');

} catch (err) {
  console.error('Test execution error:', err);
  process.exitCode = 1;
}

console.log('\n====================================================');
console.log(`COMPONENT TESTS: ${passedTests}/${totalTests} PASSED`);
console.log('====================================================');
