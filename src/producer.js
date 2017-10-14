const linebyline	= require( "linebyline" );
const validations	= require( "./validations" )( );
const Joi		= require( "joi" );


const Producer = function( config ){

	const self = this;
	Joi.validate( config, validations.producerConfig, function( err, newConfig ){
		if( err ){ throw err; }

		// Note that we use newConfig because we might have some defaults defined.
		self.config = newConfig;
	} );
};



module.exports = Producer;
