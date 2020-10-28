import * as fs from 'fs'
import * as core from '@actions/core'
import {exec} from '@actions/exec'

async function run(): Promise<void> {
  try {
    const versions = JSON.stringify(
      JSON.parse(core.getInput('versions'))
    ).replace(/\\([\s\S])|(")/g, '\\$1$2');

    const initGradle = `
import groovy.json.JsonSlurper

allprojects { project ->
  def versions = new JsonSlurper().parseText("${versions}")
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
    exec(command)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
