import * as fs from 'fs'
import * as core from '@actions/core'
import {exec} from '@actions/exec'
import {create, UploadOptions} from '@actions/artifact'

async function run(): Promise<void> {
  const payload = core.getInput('versions')

  try {
    const initGradle = `
import groovy.json.JsonSlurper

allprojects { project ->
  def versions = new JsonSlurper().parseText("""${payload}""")
  project.afterEvaluate {
    def spinnakerPlugin = project.extensions.findByName("spinnakerPlugin")
    if (spinnakerPlugin != null) {
      def service = spinnakerPlugin.serviceName
      def serviceVersion = versions[spinnakerPlugin.serviceName]
      def platform = project.dependencies.platform("com.netflix.spinnaker.\${service}:\${service}-bom:$serviceVersion") {
        force = true
      }
      project.dependencies.add("testRuntime", platform)
    }
  }
}
`
    fs.writeFileSync('init.gradle', initGradle)
    const command = `./gradlew -I init.gradle test`
    core.info(`Running command: ${command}`)
    await exec(command)
  } catch (error) {
    core.setFailed(error.message)
  }

  if (process.env['CI']) {
    try {
      const runID = process.env['GITHUB_RUN_ID']
      const encodedPayload = Buffer.from(payload).toString('base64')
      const artifactName = `${runID}-${encodedPayload}`

      core.info(`Uploading dummy artifact ${artifactName}`)
      const artifactClient = create()
      const response = await artifactClient.uploadArtifact(artifactName, ['init.gradle'], '.', {}) 
      if (response.failedItems.length > 0) {
        core.setFailed(`Could not upload artifacts`)
      }
    } catch (error) {
      core.setFailed(error.message)
    }
  } 
}

run()
