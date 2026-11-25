import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { z } from 'zod'
import * as schema from '../src/domain/contracts.ts'
import { exportPack, previewProposal, validateLibrary } from '../src/domain/authoring.ts'
import { fixture, sampleProposal } from '../src/domain/fixture.ts'

async function load(path, limit) {
  const file = await readFile(path)
  if (file.length > limit) throw new Error(path + ' exceeds the maximum size.')
  return schema.parseJSON(file.toString('utf8'), limit)
}
try {
  const [first, proposalPath] = process.argv.slice(2)
  if (first === '--write-examples') {
    const output = new URL('../contracts/', import.meta.url)
    const set = { player: schema.player, team: schema.team, lineup: schema.lineup, strategy: schema.strategy,
      case: schema.playCase, moment: schema.moment, contact: schema.contact, review: schema.review,
      proposal: schema.proposal, pack: schema.pack, 'editable-copy': schema.editableShare, library: schema.library }
    await mkdir(output, { recursive: true })
    await Promise.all(Object.entries(set).map(([key, value]) =>
      writeFile(new URL(key + '.schema.json', output), JSON.stringify(z.toJSONSchema(value, { reused: 'ref' }), null, 2) + '\n')))
    const l = validateLibrary(fixture()), p = sampleProposal(l), plan = l.plans[0]
    const pack = schema.pack.parse({ ...exportPack(l, plan, p.scope[0]), plan })
    await Promise.all([
      writeFile(new URL('synthetic-pack.json', output), JSON.stringify(pack) + '\n'),
      writeFile(new URL('synthetic-proposal.json', output), JSON.stringify(p, null, 2) + '\n'),
    ])
  } else {
    if (first && !proposalPath) throw new Error('Usage: npm run validate:proposal -- [library-backup.json proposal.json]')
    const l = first ? validateLibrary(await load(first, schema.MAX_LIBRARY_BYTES)) : validateLibrary(fixture())
    const p = proposalPath ? await load(proposalPath, schema.MAX_PROPOSAL_BYTES) : sampleProposal(l)
    const result = previewProposal(l, p)
    console.log(JSON.stringify({ revision: result.plan.revision, diff: result.diff, issues: result.issues }, null, 2))
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : 'Invalid authoring payload')
  process.exitCode = 1
}
