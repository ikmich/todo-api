
var _ = require('underscore');
var bcrypt = require('bcrypt');
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');

module.exports = function (sequelize, DataTypes) {
	var User = sequelize.define('user', {
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				notEmpty: true,
				isEmail: true
			}
		},
		salt: {
			type: DataTypes.STRING
		},
		password_hash: {
			type: DataTypes.STRING
		},
		password: {
			type: DataTypes.VIRTUAL,
			allowNull: false,
			validate: {
				notEmpty: true,
				len: [7, 100]
			},
			set: function (value) {
				var salt = bcrypt.genSaltSync(10);
				var hashedPassword = bcrypt.hashSync(value, salt);

				// Set the model property values...
				this.setDataValue('password', value);
				this.setDataValue('salt', salt);
				this.setDataValue('password_hash', hashedPassword);
			}
		}
	}, {
		hooks: {
			beforeValidate: function (user, options) {
				if (typeof user.email === 'string') {
					user.email = user.email.toLowerCase();
				}
			}
		},

		// Add instance methods to the model instance.
		instanceMethods: {
			toPublicJSON: function () {
				var json = this.toJSON();
				return _.pick(json, "id", "email", "createdAt", "updatedAt");
			},
			generateToken: function (type) {
				if (!_.isString(type)) {
					return undefined;
				}

				try {
					var tokenData = { 
						id: this.get('id'), 
						type: type 
					};
					var stringData = JSON.stringify(tokenData);

					var encryptedData = cryptojs.AES.encrypt(stringData, "abc123!@#!").toString();

					var token = jwt.sign({
						token: encryptedData
					}, 'qwerty098');

					return token;
				} catch (e) {
					console.error(e);
					return undefined;
				}
			}
		},

		// Add class methods to the DAO
		classMethods: {
			authenticate: function (body) {
				return new Promise(function (resolve, reject) {
					if (typeof body.email !== 'string'
						|| typeof body.password !== 'string') {
						return reject();
					}

					User.findOne({
						where: {
							'email': body.email
						}
					}).then(function (user) {
						if (!user || !bcrypt.compareSync(body.password, user.password_hash)) {
							return reject();
						}

						resolve(user);
					}, function (e) {
						reject(e);
					});
				});
			},

			findByToken: function (token) {
				return new Promise(function (resolve, reject) {
					try {
						var decodedJWT = jwt.verify(token, 'qwerty098');

						var bytes = cryptojs.AES.decrypt(decodedJWT.token, "abc123!@#!");
						var tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));

						User.findById(tokenData.id).then(function (user) {
							if (user) {
								resolve(user);
							} else {
								reject();
							}
						}, function (e) {
							reject(e);
						});
					} catch (e) {
						reject(e);
					}
				});
			}
		}
	});

	return User;
}