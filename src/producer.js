const linebyline	= require( "linebyline" );
const Joi		= require( "joi" );

const validations	= require( "./validations" )( );

const EventEmitter	= require( "events" ).EventEmitter;
const util		= require( "util" );

const ProducerEvents	= require( "./events" ).Producer;
const producerEvents	= new ProducerEvents( );

const Producer = function( config ){

	const self = this;
	Joi.validate( config, validations.producerConfig, function( err, newConfig ){
		if( err ){ throw err; }

		// Note that we use newConfig because we might have some defaults defined.
		self.config = newConfig;

		const next = function( ){

			// We're ready as a producer; Let's go ahead and let eveyone know.
			self.emit( producerEvents.readyToStart( ) );

			// If we have autoStart as true, we should 
			// call start automatically when we're ready.
			if( newConfig.autoStart ){
				self.start( );
			}
		};

		// If we are testing, let's wait 200ms before 
		// going forward.
		if( newConfig.test ){
			setTimeout( next, 200 );
		}else{
			next();
		}
	} );
};

util.inherits( Producer, EventEmitter );

module.exports = Producer;
