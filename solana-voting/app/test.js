const { Connection, PublicKey } = require('@solana/web3.js');

const PROGRAM_ID = new PublicKey('FoVqhkdSMVooKQm8t4XKX3Yg7LHjpe8CzZ962KzR5dsL');
const conn = new Connection('https://api.devnet.solana.com');

const pollAddr = process.argv[2];
if (!pollAddr) {
  console.error('Usage: node check-voters.js <POLL_PDA_ADDRESS>');
  process.exit(1);
}

// Borsh string reader: [4 bytes LE length][N bytes UTF-8]
function readString(buf, offset) {
  const len = buf.readUInt32LE(offset);
  const str = buf.slice(offset + 4, offset + 4 + len).toString('utf8');
  return { value: str, next: offset + 4 + len };
}

function decodePoll(data) {
  // Layout: [8 disc][8 id][32 creator][string title][string desc][vec<PollOption>][8 endTime][1 bump]
  // PollOption: [string name][8 votes]
  let off = 8 + 8 + 32; // skip discriminator + id + creator pubkey
  const title = readString(data, off); off = title.next;
  const desc = readString(data, off);  off = desc.next;
  const optCount = data.readUInt32LE(off); off += 4;
  const options = [];
  for (let i = 0; i < optCount; i++) {
    const name = readString(data, off); off = name.next;
    const votes = data.readBigUInt64LE(off); off += 8;
    options.push({ name: name.value, votes: Number(votes) });
  }
  return { title: title.value, description: desc.value, options };
}

(async () => {
  const POLL = new PublicKey(pollAddr);

  // 1. Fetch the poll itself to get option names
  const pollAcc = await conn.getAccountInfo(POLL);
  if (!pollAcc) {
    console.error('Poll account not found');
    process.exit(1);
  }
  const poll = decodePoll(pollAcc.data);

  console.log(`\n📊 Poll: "${poll.title}"`);
  if (poll.description) console.log(`   ${poll.description}`);
  console.log(`   Options: ${poll.options.map((o, i) => `[${i}] ${o.name}`).join(', ')}\n`);

  // 2. Fetch all voter records for this poll
  const accounts = await conn.getProgramAccounts(PROGRAM_ID, {
    filters: [
      { dataSize: 73 },
      { memcmp: { offset: 8 + 32, bytes: POLL.toBase58() } },
    ],
  });

  console.log(`Found ${accounts.length} voter record(s):\n`);
  accounts.forEach((a, i) => {
    const data = a.account.data;
    const voter = new PublicKey(data.slice(8, 40)).toString();
    const optionIndex = data[72];
    const optionName = poll.options[optionIndex]?.name ?? '?';
    console.log(`  ${i + 1}. ${voter}`);
    console.log(`     → voted for: "${optionName}" (option #${optionIndex})`);
    console.log(`     → record:    ${a.pubkey.toString()}\n`);
  });

  // 3. Tally summary
  const tally = {};
  accounts.forEach((a) => {
    const idx = a.account.data[72];
    const name = poll.options[idx]?.name ?? `option ${idx}`;
    tally[name] = (tally[name] || 0) + 1;
  });
  console.log('📈 Final tally:');
  Object.entries(tally).forEach(([name, count]) => {
    console.log(`     ${name}: ${count} ${count === 1 ? 'vote' : 'votes'}`);
  });
  console.log();
})();