import * as fs from 'fs';
import * as path from 'path';

/**
 * Extract NativeBondingCurve bytecode for deployment
 * Run: npx ts-node scripts/get-native-bytecode.ts
 */
async function main() {
  console.log('🔍 Extracting NativeBondingCurve bytecode...\n');

  const artifactPath = path.join(
    __dirname,
    '../artifacts/contracts/NativeBondingCurve.sol/NativeBondingCurve.json'
  );

  if (!fs.existsSync(artifactPath)) {
    console.error('❌ Artifact not found! Please compile first:');
    console.error('   npx hardhat compile\n');
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const bytecode = artifact.bytecode;

  if (!bytecode || bytecode === '0x') {
    console.error('❌ Bytecode is empty!');
    process.exit(1);
  }

  console.log('✅ Bytecode extracted successfully!');
  console.log(`Length: ${bytecode.length} characters\n`);

  console.log('📝 Add this to your .env.local file:\n');
  console.log('NATIVE_BONDING_CURVE_BYTECODE=' + bytecode);
  console.log('\n');

  console.log('💡 Quick setup:');
  console.log('1. Copy the line above');
  console.log('2. Add it to .env.local');
  console.log('3. Restart your dev server');
  console.log('4. Create a new wiki - it will use native M! 🎉');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
