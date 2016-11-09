/*
 Todo model.
 */ 
module.exports = function (sequelize, DataTypes) {
	var Todo = sequelize.define('todo', {
		description: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: true,
				len: [1, 250]
			}
		},
		completed: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		dueDate: {
			type: DataTypes.DATE,
			defaultValue: Sequelize.NOW
		}
	});
	return Todo;
}