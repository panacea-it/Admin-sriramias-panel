import 'dotenv/config'
import { connectDB, validateMongoUri } from '../config/db.js'

const uri = process.env.MONGO_URI
const check = validateMongoUri(uri)

console.log('\nMongoDB URI check\n-----------------')

if (!check.ok) {
  console.error('FAIL:', check.message)
  if (check.host) {
    console.error('\nDetected:')
    console.error('  Host:', check.host)
    console.error('  User:', check.user)
    console.error('  DB:  ', check.database)
  }
  console.error('\nFix backend/.env with the FULL string from Atlas → Connect → Drivers.\n')
  process.exit(1)
}

console.log('Host:    ', check.host)
console.log('User:    ', check.user)
console.log('Database:', check.database)
console.log('\nConnecting...')

try {
  await connectDB()
  console.log('SUCCESS — you can run: npm run dev\n')
  process.exit(0)
} catch (err) {
  console.error('FAIL:', err.message)
  process.exit(1)
}
