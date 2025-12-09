import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env.local' });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials not found in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Find GG token
  const { data, error } = await supabase
    .from('wikis')
    .select('*')
    .eq('token_symbol', 'GG')
    .single();

  if (error) {
    console.error('❌ Error fetching GG token:', error.message);
    process.exit(1);
  }

  if (!data) {
    console.log('❌ GG token not found in database');
    process.exit(1);
  }

  console.log('\n=== GG Token Info ===');
  console.log('ID:', data.id);
  console.log('Title:', data.title);
  console.log('Token Symbol:', data.token_symbol);
  console.log('Token Address:', data.token_address);
  console.log('Bonding Curve Address:', data.bonding_curve_address || 'Not set');
  console.log('Created:', new Date(data.created_at).toLocaleString());

  if (data.token_address) {
    console.log('\n=== Next Steps ===');
    console.log('1. Deploy native bonding curve:');
    console.log(`   npx hardhat run scripts/deploy-native-bonding-curve.ts --network memecoreInsectarium -- --token ${data.token_address}`);
    console.log('\n2. After deployment, update database with new bonding curve address');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
