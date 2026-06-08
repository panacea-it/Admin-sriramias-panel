import dns from 'node:dns'
import mongoose from 'mongoose'

/**
 * mongodb+srv:// requires DNS SRV lookups. Many ISP/router DNS servers
 * (e.g. 192.168.1.1) refuse SRV queries → querySrv ECONNREFUSED in Node.
 * Use reliable public DNS before connecting (override via DNS_SERVERS in .env).
 */
function configureDnsForSrv() {
  const fromEnv = process.env.DNS_SERVERS?.split(',').map((s) => s.trim()).filter(Boolean)
  const servers = fromEnv?.length ? fromEnv : ['8.8.8.8', '8.8.4.4', '1.1.1.1']
  dns.setServers(servers)
}

/** Atlas SRV hostnames: cluster0.xxxxx.mongodb.net */
const VALID_ATLAS_HOST =
  /^[a-z0-9-]+\.[a-z0-9]+\.mongodb\.net$/i

export function parseMongoUri(uri) {
  try {
    const normalized = uri.replace(/^mongodb\+srv:\/\//, 'https://')
    const url = new URL(normalized)
    return {
      host: url.hostname,
      database: url.pathname.replace(/^\//, '').split('?')[0] || '(default)',
      user: url.username || '(missing)',
    }
  } catch {
    return null
  }
}

export function validateMongoUri(uri) {
  if (!uri?.trim()) {
    return { ok: false, message: 'MONGO_URI is empty. Set it in backend/.env' }
  }

  const parsed = parseMongoUri(uri)
  if (!parsed) {
    return { ok: false, message: 'MONGO_URI is not a valid connection string' }
  }

  const { host, database, user } = parsed

  if (host === 'cluster0.mongodb.net' || host === 'cluster.mongodb.net') {
    return {
      ok: false,
      host,
      user,
      database,
      message:
        `Invalid host "${host}". Use the full Atlas host, e.g. cluster0.6v1ggwq.mongodb.net`,
    }
  }

  if (uri.startsWith('mongodb+srv://') && !VALID_ATLAS_HOST.test(host)) {
    return {
      ok: false,
      host,
      user,
      database,
      message: `Host "${host}" does not look like a valid Atlas hostname.`,
    }
  }

  return { ok: true, host, user, database }
}

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  const uri = process.env.MONGO_URI_DIRECT || process.env.MONGO_URI
  const check = validateMongoUri(uri)

  if (!check.ok) {
    console.error('\n--- MongoDB connection check failed ---')
    if (check.host) {
      console.error(`  Host:     ${check.host}`)
      console.error(`  User:     ${check.user}`)
      console.error(`  Database: ${check.database}`)
    }
    console.error(`  Reason:   ${check.message}\n`)
    throw new Error(check.message.split('\n')[0])
  }

  mongoose.set('strictQuery', true)

  if (uri.startsWith('mongodb+srv://')) {
    configureDnsForSrv()
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 })
    console.log(`MongoDB Atlas connected (${check.host} / ${check.database})`)
  } catch (error) {
    if (error.message?.includes('querySrv')) {
      console.error(
        '\nSRV DNS lookup failed. Your router/ISP DNS may block SRV records.\n' +
          'Fix: set Windows DNS to 8.8.8.8, or add DNS_SERVERS=8.8.8.8,8.8.4.4 to backend/.env\n' +
          'Or use MONGO_URI_DIRECT with a standard mongodb:// string from Atlas Compass.\n',
      )
    }
    if (error.message?.includes('bad auth') || error.code === 8000) {
      throw new Error(
        'Authentication failed. Check admin_sriram / password in Atlas → Database Access.',
      )
    }
    if (error.name === 'MongooseServerSelectionError') {
      throw new Error(
        'Cannot reach MongoDB cluster. In Atlas → Network Access, add your IP or Allow Access from Anywhere (0.0.0.0/0).',
      )
    }
    throw error
  }
}
