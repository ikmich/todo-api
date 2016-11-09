var cryptojs = require('crypto-js');

module.exports = function(db) {
	return {
		requireAuthentication: function(req, res, next) {
			var token = req.get('Auth') || "";

			db.TokenDao.findOne({
				where: {
					'tokenHash': cryptojs.MD5(token).toString()
				}
			}).then(function(tokenInstance){
				if (!tokenInstance) {
					throw new Error();
				}

				req.tokenInstance = tokenInstance;

				return db.User.findByToken(token);
			}).then(function(user){
				req.user = user;
				next();
			}).catch(function(e){
				console.log("Error:");
				console.log(e);
				res.status(401).json({"error": e.message});
			});
		}
	};
};