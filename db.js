var Sequelize = require('sequelize');
var env = process.env.NODE_ENV || 'development';
var sequelize;

if (env === 'production') {
	sequelize = new Sequelize(process.env.DATABASE_URL, {
		'dialect': 'postgres'
	});
} else {
	sequelize = new Sequelize(undefined, undefined, undefined, {
		'dialect': 'sqlite',
		'storage': __dirname + '/data/dev-todo-api.sqlite'
	});
}

var db = {};

db.Todo = sequelize.import(__dirname + '/models/todo.js');
db.User = sequelize.import(__dirname + '/models/user.js');
db.TokenDao = sequelize.import(__dirname + '/models/token.js');

db.sequelize = sequelize;
db.Sequelize = Sequelize;

/*
 * Define the associations between a Todo and a User.
 * A Todo belongs to a User, and a User has many Todo's.
 */
db.Todo.belongsTo(db.User);
db.User.hasMany(db.Todo);

module.exports = db;