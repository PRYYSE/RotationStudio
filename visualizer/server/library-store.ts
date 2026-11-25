export interface Database {
  prepare(sql: string): {
    bind(...values: (string | number)[]): {
      first<T>(): Promise<T | null>
      run(): Promise<{ meta: { changes: number } }>
    }
  }
}
type Row = { revision: number; document: string }
type Saved = { revision: number; fingerprint: string }

export async function latest(db: Database, owner: string) {
  return db.prepare('SELECT revision, document FROM library_revisions WHERE owner = ? ORDER BY revision DESC LIMIT 1').bind(owner).first<Row>()
}
export async function priorRequest(db: Database, owner: string, id: string) {
  return db.prepare('SELECT revision, fingerprint FROM library_revisions WHERE owner = ? AND request_id = ?').bind(owner, id).first<Saved>()
}

export async function insertRevision(db: Database, owner: string, expected: number, id: string, fingerprint: string, document: string) {
  // The compare and insert run in one SQLite statement. The second unique
  // constraint protects request replay even when two devices race.
  const result = await db.prepare(`INSERT OR IGNORE INTO library_revisions (owner, revision, request_id, fingerprint, document)
    SELECT ?, ?, ?, ?, ?
    WHERE COALESCE((SELECT MAX(revision) FROM library_revisions WHERE owner = ?), 0) = ?`)
    .bind(owner, expected + 1, id, fingerprint, document, owner, expected).run()
  return result.meta.changes === 1
}
