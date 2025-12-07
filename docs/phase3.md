Continue development for Memekipedia.

=== GOAL ===
Implement IPFS upload (Infura) + Snapshot JSON system.

=== SNAPSHOT JSON FORMAT ===
{
  "version": 1,
  "type": "wiki",
  "title": "...",
  "category": "...",
  "body_mdx": "...",
  "media": [
    { "type": "image", "cid": "Qm...", "filename": "..." }
  ],
  "editor": "0x123...",
  "timestamp": 1700000000
}

=== REQUIREMENTS ===
1. /lib/ipfs.ts:
   uploadText → CID  
   uploadFile → CID  
   uploadSnapshot(snapshot) → CID  

2. File size limits:
   - image/video < 5MB
   - snapshot < 1MB

3. Editor integrations:
   - ImageUploadButton → Uploads to IPFS
   - Snapshot save function

4. Supabase table: wiki
   - id
   - title
   - category
   - cid (text)
   - editor (wallet)
   - created_at
   - updated_at

Generate all code.
Only output code.

