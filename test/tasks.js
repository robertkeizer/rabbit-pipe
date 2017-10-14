const Tasks = function( ){
	
};

Tasks.prototype.validSpecProducerConfig = function( ){
	return {
		rabbit: {
			host: "localhost",
			port: 5672
		}
	};
};

module.exports = Tasks;
