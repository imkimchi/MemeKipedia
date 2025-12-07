-- Migration: Add Memecore token fields to wiki table
-- This migration adds support for tracking MRC-20 tokens deployed for each wiki

-- Add token-related columns to wiki table
ALTER TABLE wiki
ADD COLUMN IF NOT EXISTS token_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS token_symbol VARCHAR(10),
ADD COLUMN IF NOT EXISTS token_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS token_supply VARCHAR(78), -- Support up to 2^256-1
ADD COLUMN IF NOT EXISTS deploy_tx_hash VARCHAR(66),
ADD COLUMN IF NOT EXISTS token_network VARCHAR(20) DEFAULT 'insectarium';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_wiki_token_address ON wiki(token_address);
CREATE INDEX IF NOT EXISTS idx_wiki_token_symbol ON wiki(token_symbol);

-- Add comment explaining the fields
COMMENT ON COLUMN wiki.token_address IS 'Memecore blockchain address of the deployed MRC-20 token';
COMMENT ON COLUMN wiki.token_symbol IS 'Token symbol (ticker), auto-generated from wiki title';
COMMENT ON COLUMN wiki.token_name IS 'Full token name, same as wiki title';
COMMENT ON COLUMN wiki.token_supply IS 'Initial token supply (in smallest unit)';
COMMENT ON COLUMN wiki.deploy_tx_hash IS 'Transaction hash of token deployment';
COMMENT ON COLUMN wiki.token_network IS 'Memecore network (mainnet, insectarium, formicarium)';
