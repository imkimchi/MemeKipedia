-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet TEXT UNIQUE NOT NULL,
  nickname TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on wallet
CREATE INDEX idx_users_wallet ON users(wallet);

-- Wiki table
CREATE TABLE wiki (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  cid TEXT NOT NULL,
  editor TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for search
CREATE INDEX idx_wiki_category ON wiki(category);
CREATE INDEX idx_wiki_editor ON wiki(editor);
CREATE INDEX idx_wiki_created_at ON wiki(created_at DESC);
CREATE INDEX idx_wiki_updated_at ON wiki(updated_at DESC);

-- Full-text search index
CREATE INDEX wiki_fts_idx ON wiki USING GIN (to_tsvector('simple', title || ' ' || category));

-- Bounty table
CREATE TABLE bounty (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_m NUMERIC NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  creator TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bounty submission table
CREATE TABLE bounty_submission (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bounty_id UUID REFERENCES bounty(id) ON DELETE CASCADE,
  submitter TEXT NOT NULL,
  cid TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_bounty_creator ON bounty(creator);
CREATE INDEX idx_bounty_status ON bounty(status);
CREATE INDEX idx_bounty_deadline ON bounty(deadline);
CREATE INDEX idx_submission_bounty ON bounty_submission(bounty_id);
CREATE INDEX idx_submission_upvotes ON bounty_submission(upvotes DESC);
