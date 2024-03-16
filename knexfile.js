module.exports = {
	development: {
		client: "mysql2",
		connection: {
			host: process.env.DB_HOST,
			database: process.env.DB_DBNAME,
			user: process.env.DB_USERNAME,
			password: process.env.DB_PASSWORD,
		},
		pool: {
			min: 0,
			max: 7,
		},
		migrations: {
			tableName: "knex_migrations",
			directory: "./database/migrations",
		},
		seeds: {
			directory: "./database/seeds",
		},
	},
	production: {
		// client: 'postgresql',
		// connection: {
		//     database: 'ona12',
		//     user: 'postgres',
		//     password: '1234'
		// },
		// pool: {
		//     min: 2,
		//     max: 10
		// },
		// migrations: {
		//     tableName: 'knex_migrations'
		// }
	},
}