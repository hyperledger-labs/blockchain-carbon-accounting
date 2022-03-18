import { Dialect } from 'sequelize'
const dbName = process.env.DB_NAME as string || 'blockchain-carbon-accounting'
const dbDialect = 'postgres'

export type DbOpts = {
  dbName: string, 
  dbUser: string, 
  dbPassword: string,
  dbHost: string,
  dbDialect: Dialect,
  dbVerbose: boolean,
  dbClear: boolean
};

export const addCommonYargsOptions = (yargs) => {
  return yargs
    .option('dbname', {
      type: 'string',
      default: dbName,
      description: `The postgres database to use.`,
    })
    .option('dbuser', {
      type: 'string',
      description: 'The postgres user to use.',
    })
    .option('dbpassword', {
      type: 'string',
      description: 'The postgres password to use.',
    })
    .option('dbhost', {
      type: 'string',
      description: 'The postgres host to use.',
    })
    .option('dbverbose', {
      type: 'boolean',
      description: 'Set this flag to show the DB debug output.',
    })
    .option('dbclear', {
      type: 'boolean',
      description: 'Set this flag to recreate the tables of the DB, you will lose all previous data.',
    })
}

export const parseCommonYargsOptions = (argv): DbOpts => {
  const opts = {
    dbName: argv['dbname'] || process.env.DB_NAME as string || 'blockchain-carbon-accounting',
    dbUser: argv['dbuser'] || process.env.DB_USER as string,
    dbPassword: argv['dbpassword'] || process.env.DB_PASSWORD as string,
    dbHost: argv['dbhost'] || process.env.DB_HOST as string,
    dbDialect: dbDialect as Dialect,
    dbVerbose: argv['dbverbose'],
    dbClear: argv['dbclear']
  }
  return opts
}
