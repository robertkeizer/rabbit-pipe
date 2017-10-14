const Joi = require( "joi" );

const Validations = function( ){
	
	return {
		producerConfig: Joi.object( ).keys( {
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
