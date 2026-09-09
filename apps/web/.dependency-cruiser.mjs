import { WebDependencyConfiguration } from './dependency-cruiser-config.mjs'

/** @type {import('dependency-cruiser').IConfiguration} */
const configuration = WebDependencyConfiguration({
  migrationScope: '^src/ui/formalization/',
})

export default configuration
