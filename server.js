var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function (req, res) {
	res.send('Todo API root');
});

app.get('/todos', function (req, res) {
	var queryParams = req.query;
	var filteredTodos = todos;

	// if has property && completed === 'true'
	if (queryParams.hasOwnProperty('completed')) {
		if (queryParams.completed === 'true') {
			filteredTodos = _.where(filteredTodos, {completed: true});
		} else if (queryParams.completed === 'false') {
			filteredTodos = _.where(filteredTodos, {completed: false});
		}
	}

	if (queryParams.hasOwnProperty('q')
			&& queryParams.q.trim().length > 0) {
		filteredTodos = _.filter(filteredTodos, function(todo){
			return todo.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1;
		});
	}

	res.json(filteredTodos);
}); 

// GET /todos/:id
app.get('/todos/:id', function (req, res) {
	var todoId = parseInt(req.params.id, 10);

	db.todo.findById(todoId).then(function(todo){
		if (!!todo) {
			res.json(todo.toJSON());
		} else {
			res.status(404).json({"error": "Not found"});
		}
	}).catch(function(e){
		res.status(500).send();
	});
});

// POST /todos
app.post('/todos', function(req, res){
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create({
		description: body.description.trim(),
		completed: body.completed
	}).then(function(todo){
		var result = _.pick(todo.toJSON(), 'description', 'completed');
		res.json(result);
	}).catch(function(e){
		console.log(e.message);
		res.status(400).json(e);
	});
});

// DELETE /todos/:id
app.delete('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	var matchedTodo = _.findWhere(todos, {id: todoId});

	if (!matchedTodo) {
		res.status(404).json({"error": 'No such item found'});
	} else {
		todos = _.without(todos, matchedTodo);
		res.json(matchedTodo);
	}
});

// PUT /todos/:id
app.put('/todos/:id', function(req, res){
	var todoId = parseInt(req.params.id, 10);
	var matchedTodo = _.findWhere(todos, {id: todoId});

	if (!matchedTodo) {
		return res.status(404).send();
	}

	var body = _.pick(req.body, 'description', 'completed');
	var validAttributes = {};

	if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
		validAttributes.completed = body.completed;
	} else if (body.hasOwnProperty('completed')) {
		// Bad . Hmm.
		return res.status(400).json({"error": "Inavlid 'completed' property."});
	} else {
		// Never provided attribute. No problem here.
	}

	if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0) {
		// good
		validAttributes.description = body.description;
	} else if (body.hasOwnProperty('description')) {
		// Bad
		return res.status(400).json({"error":"Invalid 'description' property"});
	} else {
		// no prob
	}

	_.extend(matchedTodo, validAttributes);

	res.json(matchedTodo);
});

db.sequelize.sync().then(function(){
	app.listen(PORT, function () {
		console.log('Express listening on port ' + PORT + '!');
	});
});

