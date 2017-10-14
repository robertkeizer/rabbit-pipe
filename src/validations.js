const Joi = require( "joi" );

const Validations = function( ){
	
	return {
		producerConfig: Joi.object( ).keys( {
			test: Joi.boolean( ).default( false ),
			autoStart: Joi.boolean( ).default( false ),
			rabbit: Joi.object( ).keys( {
				host: Joi.alternatives( ).try(
					Joi.string( ).hostname(),
					Joi.string( ).ip( { cidr: 'forbidden' } )
				).required( ),
				port: Joi.number( ).integer( ).min( 1 ).max( 65534 )
			} ).required( )
		} ).required( )
	};
};

module.exports = Validations;
