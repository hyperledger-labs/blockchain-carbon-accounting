const dbName = process.env.DB_NAME as string

export type DbOpts = {
  dbName: string, 
  dbUser: string, 
  dbPassword: string,
  dbHost: string,
  dbPort: number,
  dbVerbose: boolean,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const addCommonYargsOptions = (yargs: any) => {
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
    .option('dbport', {
      type: 'number',
      description: 'The postgres port to use.',
    })
    .option('dbverbose', {
      type: 'boolean',
      description: 'Set this flag to show the DB debug output.',
    })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseCommonYargsOptions = (argv: any): DbOpts => {
  const opts = {
    dbName: argv['dbname'] || process.env.DB_NAME as string,
    dbUser: argv['dbuser'] || process.env.DB_USER as string,
    dbPassword: argv['dbpassword'] || process.env.DB_PASSWORD as string,
    dbHost: argv['dbhost'] || process.env.DB_HOST as string,
    dbPort: argv['dbport'] || parseInt(process.env.DB_PORT as string || '5432'),
    dbVerbose: argv['dbverbose'] || (process.env.DB_VERBOSE === 'Y'),
  }
  return opts
}
