const linebyline	= require( "linebyline" );
const Joi		= require( "joi" );

const validations	= require( "./validations" )( );

const EventEmitter	= require( "events" ).EventEmitter;
const util		= require( "util" );

const ProducerEvents	= require( "./events" ).Producer;
const producerEvents	= new ProducerEvents( );

const Producer = function( config ){

	// We may want to be a bit introspective
	// and wait for certain listeners; This allows
	// us to keep track of them.
	this._readyListenerExists = false;
	this._setupListeners( );

	this._running = false;

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

		// Simple loop waiting for ready
		if( newConfig.waitForReadyListener ){
			const checkLoop = function( ){
				if( self._readyListenerExists ){
					next( );
				}else{
					setTimeout( checkLoop, 200 );
				}
			};
			checkLoop( );
		}else{
			next();
		}
	} );
};

util.inherits( Producer, EventEmitter );

Producer.prototype._setupListeners = function( ){
	const self = this;
	self.on( "newListener", function( eventName ){
		if( eventName == producerEvents.readyToStart() ){
			self._readyListenerExists = true;
		}
	} );
};

// This is called if autoStart is true, right after the
// readyToStart event is fired. It call also be called manually
// for some reason if you have autoStart off.
Producer.prototype.start = function( ){
		
	if( this._running ){
		return this.emit.apply( this, producerEvents.startCalledWhenAlreadyRunning( ) );
	}else{
		this._running = true;
	}

	this.emit( producerEvents.startingUp( ) );

	if( !this.config.useStdin && !this.inputEmitter ){
		this.emit.apply( this, producerEvents.noStdinAndNoInputEmitter( ) );
		// remember to flick the switch because
		// we haven't actually started up.
		this._running = false;
		return;
	}

	this.emit( producerEvents.running( ) );
};

Producer.prototype.die = function( ){
	this.removeAllListeners( );
};

module.exports = Producer;
