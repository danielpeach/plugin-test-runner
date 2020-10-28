import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  process.env['INPUT_VERSIONS'] = JSON.stringify(
    JSON.parse('{"platform":"1.22.0","orca":"2.15.2-20200806164929"}'),
    null,
    2
  )
  const ip = path.join(__dirname, '..', 'src', 'main.ts')
  const options: cp.ExecSyncOptions = {
    env: process.env
  }
  console.log(cp.execSync(`npx ts-node ${ip}`, options).toString())
})
