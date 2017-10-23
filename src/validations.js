const Joi = require( "joi" );

const Validations = function( ){
	
	return {
		producerConfig: Joi.object( ).keys( {
			dieOnEnd: Joi.boolean( ).default( false ),
			waitForReadyListener: Joi.boolean( ).default( false ),
			autoStart: Joi.boolean( ).default( false ),
			inputStream: Joi.object( ).required( ),
			eventNamesToListenTo: Joi.array( ).items( 
				Joi.string( )
			).unique().default( [ ] ),
			rabbit: Joi.object( ).keys( {
				host: Joi.alternatives( ).try(
					Joi.string( ).hostname()
				).required( ),
				port: Joi.number( ).integer( ).min( 1 ).max( 65534 ),
				queueName: Joi.string( ).required( ),
				queueOptions: Joi.object( ).keys( {
					durable: Joi.boolean( )
				} ).default( { durable: true } ),
				maxQueueLength: Joi.number( ).integer( ),
				checkQueueFrequency: Joi.number( ).integer( ).default( 2500 ),
				deleteQueueOnDeath: Joi.boolean( ).default( false )
			} ).required( )
		} ).required( ),
		consumerConfig: Joi.object( ).keys( {
			rabbit: Joi.object( ).keys( {
				host: Joi.alternatives( ).try(
					Joi.string( ).hostname( )
				).required( ),
				queueName: Joi.string( ).default( "incoming" ),
				ack: Joi.boolean( ).default( false )
			} ),
			autoStart: Joi.boolean( ).default( false ),
			outputStream: Joi.object( ).required( ),
			encoding: Joi.alternatives( ).try(
				Joi.string( ).valid( "utf8" ),
				Joi.boolean( )
			).default( false ),
			addNewline: Joi.boolean( ).default( false )
		} ).required( )
	};
};

module.exports = Validations;
