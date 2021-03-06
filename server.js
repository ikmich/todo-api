/*
 - Todo API.
 */
var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var bcrypt = require('bcrypt');
var middleware = require('./middleware.js')(db);

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
app.get('/todos', middleware.requireAuthentication, function (req, res) {
	var query = req.query;
	var whereOptions = {
		/**
		 * Where userId is the id of the user indicated in the Auth header.
		 */
		'userId': req.user.id
	};

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
	db.Todo.findAll({
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
app.get('/todos/:id', middleware.requireAuthentication, function (req, res) {
	var todoId = parseInt(req.params.id, 10);

	/*
	 * Use Sequelize to get the Todo object with the specified id and corresponding
	 * to the User indicated in the Auth header.
	 */	
	db.Todo.findOne({
		where: {
			'id': todoId,
			'userId': req.user.get('id')
		}
	}).then(function(todo){
		if (!!todo) {
			res.json(todo.toJSON());
		} else {
			res.status(404).json({ "error": "Not found" });
		}
	}, function(e) {
		res.status(500).json({ "error": "Something went wrong: " + e.message });
	});
});

// POST /todos
app.post('/todos', middleware.requireAuthentication, function (req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	// Use Sequelize to create a Todo item in the db.
	db.Todo.create({
		description: body.description.trim(),
		completed: body.completed
	}).then(function (todo) {
		// Handle the association between User and Todo.
		req.user.addTodo(todo).then(function(){
			/*
			 * At this point, the Todo object has been updated with the User
			 * association, so 'reload()' has to be called on it.
			 */
			return todo.reload();
		}).then(function(todo){
			// Respond with the reloaded Todo object.
			res.json(todo.toJSON());
		});
	}).catch(function (e) {
		res.status(400).json(e);
	});
});

// DELETE /todos/:id
app.delete('/todos/:id', middleware.requireAuthentication, function (req, res) {
	var todoId = parseInt(req.params.id, 10);

	// Use Sequelize to delete the todo item specified by id.
	db.Todo.destroy({
		where: {
			'id': todoId,
			'userId': req.user.get('id')
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
app.put('/todos/:id', middleware.requireAuthentication, function (req, res) {
	var todoId = parseInt(req.params.id, 10);
	
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
	db.Todo.findOne({
		where: {
			'id': todoId,
			'userId': req.user.get('id')
		}
	}).then(function (todo) {
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
		res.status(500).json({ "error": "Something went wrong: " + e.message });
	});
});

// POST /users/register
app.post('/users', function (req, res) {
	var body = _.pick(req.body, 'email', 'password');

	// Use Sequelize to create a user in the db.
	db.User.create({
		email: body.email.trim(),
		password: body.password
	}).then(function (user) {
		res.json(user.toPublicJSON());
	}).catch(function (e) {
		res.status(400).json({ "errors": e.errors });
		// res.status(400).json(e);
	});
});

// POST /users/login
app.post('/users/login', function (req, res) {
	var body = _.pick(req.body, "email", "password");
	var userInstance;

	db.User.authenticate(body).then(function(user){
		var token = user.generateToken('authentication');
		userInstance = user;

		return db.TokenDao.create({
			'token': token
		});
	}).then(function(tokenInstance){
		res.header('Auth', tokenInstance.get('token')).json(userInstance.toPublicJSON());
	}).catch(function(e){
		res.status(401).json({"error": e.message});
	});
});

// POST /users/logout
app.post('/users/logout', middleware.requireAuthentication, function(req, res){
	req.tokenInstance.destroy().then(function(){
		res.status(200).json({"success": "1"});
	}).catch(function(e){
		res.status(500).json({"error": e.message});
	});
});

// DELETE /users/login
app.delete('/users/login', middleware.requireAuthentication, function(req, res){
	req.tokenInstance.destroy().then(function(){
		// res.status(204).send();
		res.status(200).json({"success": "1"});
	}).catch(function(e){
		res.status(500).json({"error": e.message});
	});
});

db.sequelize.sync({
	force: true
}).then(function () {
	app.listen(PORT, function () {
		console.log('Express listening on port ' + PORT + '!');
	});
});