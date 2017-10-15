const Joi = require( "joi" );

const Validations = function( ){
	
	return {
		producerConfig: Joi.object( ).keys( {
			waitForReadyListener: Joi.boolean( ).default( false ),
			autoStart: Joi.boolean( ).default( false ),
			inputEmitter: Joi.object( ).required( ),
			eventNamesToListenTo: Joi.array( ).items( 
				Joi.string( )
			).unique().default( [ ] ),
			rabbit: Joi.object( ).keys( {
				host: Joi.alternatives( ).try(
					Joi.string( ).hostname()
				).required( ),
				port: Joi.number( ).integer( ).min( 1 ).max( 65534 )
			} ).required( )
		} ).required( )
	};
};

module.exports = Validations;
