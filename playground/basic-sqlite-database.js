var Sequelize = require('sequelize');
var sequelize = new Sequelize(undefined, undefined, undefined, {
	'dialect': 'sqlite',
	'storage': 'basic-sqlite-database.sqlite'
});

var Todo = sequelize.define('todo', {
	description: {
		type: Sequelize.STRING,
		allowNull: false,
		validate: {
			notEmpty: true,
			len: [1, 250]
		}
	},
	completed: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false
	}
});

sequelize.sync({
	// force: true
}).then(function () {
	console.log('Everything is synced.');

	Todo.findById(3).then(function(todo){
		if (todo) {
			console.log('==========================');
			console.log('Todo item found:');
			console.log(todo.toJSON());
		} else {
			console.log('Todo not found');
		}
	}).catch(function(e){
		console.log(e);
	});

	// Todo.create({
	// 	description: "Take out trash",
	// 	completed: false
	// }).then(function (todo) {
	// 	return Todo.create({
	// 		description: "Clean office"
	// 	});
	// }).then(function(){
	// 	// return Todo.findById(1);
	// 	return Todo.findAll({
	// 		where: {
	// 			description: {
	// 				$like: '%trash%'
	// 			}
	// 		}
	// 	});
	// }).then(function(todos){
	// 	if (todos) {
	// 		todos.forEach(function(todo){
	// 			console.log(todo.toJSON());
	// 		});
	// 	} else {
	// 		console.log('No todo found');
	// 	}
	// }).catch(function(e){
	// 	console.log(e);
	// });
});