/*
 - Todo API.
 */
var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

// Root
app.get('/', function (req, res) {
	res.send('Todo API root');
});

// GET /todos
// GET /todos/?q=<query>&completed=<true|false>
app.get('/todos', function (req, res) {
	var query = req.query;
	var whereOptions = {};

	// Check for the 'q' query parameter.
	if (query.hasOwnProperty('q')
		&& query.q.trim().length > 0) {
		whereOptions.description = {
			$like: "%" + query.q.trim() + "%"
		};
	}

	// Check for the 'completed' query parameter.
	if (query.hasOwnProperty('completed')) {
		if (query.completed === 'true') {
			whereOptions.completed = true;
		} else if (query.completed === 'false') {
			whereOptions.completed = false;
		}
	}

	// Use Sequelize to get all the todos according to any parameters passed.
	db.todo.findAll({
		where: whereOptions
	}).then(function (todos) {
		if (todos) {
			res.json(todos);
		} else {
			res.status(404).json({ "error": "Not found" });
		}
	}).catch(function (e) {
		res.status(500).json({ "error": "Something went wrong: " + e.message });
	});
});

// GET /todos/:id
app.get('/todos/:id', function (req, res) {
	var todoId = parseInt(req.params.id, 10);

	// Use sequelize to get the todo item by id.
	db.todo.findById(todoId).then(function (todo) {
		if (!!todo) {
			res.json(todo.toJSON());
		} else {
			res.status(404).json({ "error": "Not found" });
		}
	}).catch(function (e) {
		res.status(500).json({ "error": "Something went wrong: " + e.message });
	});
});

// POST /todos
app.post('/todos', function (req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	// Use Sequelize to create a Todo item in the db.
	db.todo.create({
		description: body.description.trim(),
		completed: body.completed
	}).then(function (todo) {
		// var result = _.pick(todo.toJSON(), 'description', 'completed');
		res.json(todo.toJSON());
	}).catch(function (e) {
		// Hmm. Seems 'e' is a json type.
		res.status(400).json(e);
	});
});

// DELETE /todos/:id
app.delete('/todos/:id', function (req, res) {
	var todoId = parseInt(req.params.id, 10);

	// Use Sequelize to delete the todo item specified by id.
	db.todo.destroy({
		where: {
			id: todoId
		}
	}).then(function (n) {
		if (n > 0) {
			// => At least an item was deleted.
			res.send(n + " items deleted.");
			// res.status(204).send();
		} else {
			// Nothing deleted. No such item found.
			res.status(404).json({ "error": "No item with id " + todoId + " found." });
		}
	}).catch(function (e) {
		res.status(500).json({ "error": "Something went wrong: " + e.message });
	});
});

// PUT /todos/:id
app.put('/todos/:id', function (req, res) {
	var todoId = parseInt(req.params.id, 10);
	// var matchedTodo = _.findWhere(todos, { id: todoId });

	// if (!matchedTodo) {
	// 	return res.status(404).send();
	// }

	// Use underscore.js to pick only the valid properties.
	var body = _.pick(req.body, 'description', 'completed');
	var attributes = {};

	if (body.hasOwnProperty('completed')) {
		attributes.completed = body.completed;
	}

	if (body.hasOwnProperty('description')) {
		attributes.description = body.description;
	}

	// Find the requested item by id first. Using Sequelize...
	db.todo.findById(todoId).then(function (todo) {
		if (!!todo) {
			// ... then update the properties accordingly.
			todo.update(attributes).then(function (todo) {
				res.json(todo.toJSON());
			}, function (e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).json({ "error": "Not found" });
		}
	}, function (e) {
		res.status(500).json({"error": "Something went wrong: " + e.message});
	});
});

// POST /users
app.post('/users', function(req, res){
	var body = _.pick(req.body, 'email', 'password');

	// Use Sequelize to create a User in the db.
	db.user.create({
		email: body.email.trim(),
		password: body.password
	}).then(function(user){
		res.json(user.toJSON());
	}).catch(function(e){
		res.status(400).json({"errors": e.errors});
		// res.status(400).json(e);
	});
});

db.sequelize.sync().then(function () {
	app.listen(PORT, function () {
		console.log('Express listening on port ' + PORT + '!');
	});
});