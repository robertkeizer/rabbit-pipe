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

	this._running		= false;
	this._listeners		= [ ];

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

	// At this point we know that we have inputEmitter ready,
	// we just need to bind some listeners..

	const self = this;
	
	this.config.eventNamesToListenTo.forEach( function( name ){

		if( self._listeners[name] ){
			return self.emit.apply( producerEvents.listenerAlreadyDefinedFor(name) );
		}

		self._listeners[name] = function( comingIn ){
			self.handleIncoming( name, comingIn );
		};

		self.config.inputEmitter.on( name, self._listeners[name] );
	} );

	this.emit( producerEvents.running( ) );
};

Producer.prototype.handleIncoming = function( eventName, data ){
	console.log( "This is handle incoming; I have " );
	console.log( eventName );
	console.log( data );
	this.emit( producerEvents.handledData( ) );
};

Producer.prototype.die = function( ){
	const self = this;

	this.emit( producerEvents.dying() );

	this._listeners.forEach( function( eventName ){
		self.config.inputEmitter.removeListener( eventName, self._listeners[eventName] );
	} );
	
	// Remove all listeners to this instance of the producer.
	this.removeAllListeners( );
};

module.exports = Producer;
