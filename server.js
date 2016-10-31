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

app.get('/todos', function (req, res) {
	var query = req.query;
	var whereOptions = {};

	if (query.hasOwnProperty('q')
		&& query.q.trim().length > 0) {
		whereOptions.description = {
			$like: "%" + query.q.trim() + "%"
		};
	}

	if (query.hasOwnProperty('completed')) {
		if (query.completed === 'true') {
			whereOptions.completed = true;
		} else if (query.completed === 'false') {
			whereOptions.completed = false;
		}
	}

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
		res.status(500).send();
	});
});

// POST /todos
app.post('/todos', function (req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create({
		description: body.description.trim(),
		completed: body.completed
	}).then(function (todo) {
		// var result = _.pick(todo.toJSON(), 'description', 'completed');
		res.json(todo.toJSON());
	}).catch(function (e) {
		console.log(e.message);
		res.status(400).json(e);
	});
});

// DELETE /todos/:id
app.delete('/todos/:id', function (req, res) {
	var todoId = parseInt(req.params.id, 10);

	db.todo.destroy({
		where: {
			id: todoId
		}
	}).then(function (n) {
		if (n > 0) {
			res.send(n + " items deleted.");
		} else {
			res.status(404).json({ "error": "No item with id " + todoId + " found." });
			// res.status(204).send();
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

	var body = _.pick(req.body, 'description', 'completed');
	var attributes = {};

	if (body.hasOwnProperty('completed')) {
		attributes.completed = body.completed;
	}

	if (body.hasOwnProperty('description')) {
		// good
		attributes.description = body.description;
	}

	db.todo.findById(todoId).then(function (todo) {
		if (!!todo) {
			todo.update(attributes).then(function (todo) {
				res.json(todo.toJSON());
			}, function (e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).json({ "error": "Not found" });
		}
	}, function () {
		res.status(500).send();
	});
});

db.sequelize.sync().then(function () {
	app.listen(PORT, function () {
		console.log('Express listening on port ' + PORT + '!');
	});
});

