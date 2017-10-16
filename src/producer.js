const Joi		= require( "joi" );

const validations	= require( "./validations" )( );

const EventEmitter	= require( "events" ).EventEmitter;
const util		= require( "util" );

const ProducerEvents	= require( "./events" ).Producer;
const producerEvents	= new ProducerEvents( );

const amqplib		= require( "amqplib/callback_api" );

const Promise		= require( "promise" );

const Producer = function( config ){

	// We may want to be a bit introspective
	// and wait for certain listeners; This allows
	// us to keep track of them.
	this._readyListenerExists = false;
	this._setupListeners( );

	// This needs to start off false so that
	// our simple loop in the constructor waiting
	// for things to start up works.
	this._rabbitConnection	= false;

	this._running		= false;
	this._listeners		= [ ];
	

	const self = this;
	Joi.validate( config, validations.producerConfig, function( err, newConfig ){
		if( err ){ throw err; }

		// Note that we use newConfig because we might have some defaults defined.
		self.config = newConfig;

		// We want to setup the rabbitmq connection once we've
		// got the config in place.
		self._setupRabbitMQConnection( );

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
				if( self._rabbitConnection && self._readyListenerExists ){
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

// If we want to block wait for any listeners to us, we can do it
// here. In particular, the readyToStart event is handy as it
// is only fired when .start() could be called.
Producer.prototype._setupListeners = function( ){
	const self = this;
	self.on( "newListener", function( eventName ){
		if( eventName == producerEvents.readyToStart() ){
			self._readyListenerExists = true;
		}
	} );
};

Producer.prototype._setupRabbitMQConnection = function( ){
	const self = this;
	let _conn = false;
	amqplib.connect( "amqp://" + this.config.rabbit.host, function( err, conn ){
		if( err ){
			return self.emit( "error", err );
		}

		self._rabbitConnection	= conn;
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

	if( this._rabbitConnection ){
		self._rabbitConnection.close( function( err ){
			console.log("Closed" );
			console.log( err);
		} );
	}

	this._listeners.forEach( function( eventName ){
		self.config.inputEmitter.removeListener( eventName, self._listeners[eventName] );
	} );
	
	// Remove all listeners to this instance of the producer.
	this.removeAllListeners( );
};

module.exports = Producer;
