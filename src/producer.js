const Joi		= require( "joi" );

const validations	= require( "./validations" )( );

const EventEmitter	= require( "events" ).EventEmitter;
const util		= require( "util" );

const ProducerEvents	= require( "./events" ).Producer;
const producerEvents	= new ProducerEvents( );

const amqplib		= require( "amqplib/callback_api" );
const async		= require( "async" );

const Producer = function( config ){

	// We may want to be a bit introspective
	// and wait for certain listeners; This allows
	// us to keep track of them.
	this._readyListenerExists = false;

	// This needs to start off false so that
	// our simple loop in the constructor waiting
	// for things to start up works.
	this._rabbitConnection	= false;

	// Whether or not we are actively checking the queue length.
	// This exists so that if there is an error getting
	// the length, and we shouldn't get an error, we emit
	// the error.
	this._shouldCheckQueueLengthLoop = false;

	// Whether or not we should pause the input emitter.
	this._shouldPause	= false;

	this._running		= false;
	this._listeners		= [ ];

	// This counter is used to make sure we 
	// pause the input when we've handled the maximum
	// number of messages.. 
	this._counter = 0;

	const self = this;
	async.waterfall( [ function( cb ){

		Joi.validate( config, validations.producerConfig, cb );

	}, function( newConfig, cb ){
	
		// Note that we use newConfig because we might have some defaults defined.
		self.config = newConfig;
		return cb( null );

	}, function( cb ){

		// Setup the listeners for ourselves. IE we want
		// to know when certain listeners are attached to us,
		// so we use a listener for that. meta huh.
		self._setupListeners( cb );

	}, function( cb ){

		// We want to setup the rabbitmq connection once we've
		// got the config in place.
		self._setupRabbitMQConnection( cb );

	}, function( cb ){

		// Let's go ahead and start the loop for checking
		// the queue length.
		self._startQueueLengthLoop( cb );

	}, function( cb ){

		async.whilst( function( ){

			// If we aren't waiting for the ready, lets continue on.
			if( !self.config.waitForReadyListener ){
				return false;
			}

			// If we don't have the listener..
			if( self._readyListenerExists ){
				return false;
			}

			return true;

		}, function( cb ){

			// Let's wait 100ms for things to 
			// get attached..
			setTimeout( function( ){
				return cb( null );
			}, 100 );

		}, function( err ){

			// We're ready as a producer; Let's go ahead and let eveyone know.
			self.emit( producerEvents.readyToStart( ) );

			// If we have autoStart as true, we should 
			// call start automatically when we're ready.
			if( self.config.autoStart ){
				self.start( );
			}

			return cb( null );
		} );

	} ], function( err ){
		if( err ){ throw err; }
	} );
};

util.inherits( Producer, EventEmitter );

// If we want to block wait for any listeners to us, we can do it
// here. In particular, the readyToStart event is handy as it
// is only fired when .start() could be called.
Producer.prototype._setupListeners = function( cb ){
	const self = this;
	self.on( "newListener", function( eventName ){
		if( eventName == producerEvents.readyToStart() ){
			self._readyListenerExists = true;
		}
	} );
	return cb( null );
};

Producer.prototype._setupRabbitMQConnection = function( cb ){
	const self = this;
	let _conn = false;

	async.waterfall( [ function( cb ){

		amqplib.connect( "amqp://" + self.config.rabbit.host, cb );

	}, function( conn, cb ){

		conn.createConfirmChannel( function( err, ch ){
			return cb( err, conn, ch );
		} );

	}, function( conn, ch, cb ){

		ch.assertQueue( self.config.rabbit.queueName, self.config.rabbit.queueOptions, function( err, ok ){

			if( err ){ return cb( err ); }

			if( ok.messageCount >= self.config.rabbit.maxQueueLength && self.config.rabbit.maxQueueLength !== 0 ){
				self._shouldPause = true;
			}

			return cb( err, conn, ch );
		} );

	} ], function( err, conn, ch ){

		if( err ){
			return self.emit( "error", err );
		}

		// We want to start checking the queue length now.
		if( self.config.rabbit.checkQueueFrequency > 0 ){
			self._shouldCheckQueueLengthLoop = true;
		}

		self._rabbitConnection	= conn;
		self._rabbitChannel	= ch;
		return cb( null );
	} );
};

Producer.prototype._startQueueLengthLoop = function( cb ){
	
	// Don't start the loop if we shouldn't be looping.
	if( !this._shouldCheckQueueLengthLoop ){
		return cb( null );
	}
	
	const self = this;
	const loop = function( ){
		if( self._rabbitConnection && self._shouldCheckQueueLengthLoop ){

			async.waterfall( [ function( cb ){
				self._rabbitConnection.createChannel( cb );
			}, function( ch, cb ){
				ch.checkQueue( self.config.rabbit.queueName, function( err, reply ){
					return cb( err, ch, reply );
				} );
			} ], function( err, ch, reply ){
				if( ch ){ ch.close(); }
				if( err ){
					if( self._shouldCheckQueueLengthLoop ){
						self.emit( "error", err );
					}
				}

				if( !err && ( !reply || Object.keys( reply ).indexOf( "messageCount" ) < 0 ) ){
					// There is a problem, we didn't get an error
					// back but we also didn't get a reply or
					// a message count..
					self.emit.apply( self, producerEvents.noreplyOnCheckQueue( reply ) );
					return;
				}

				if( reply && Object.keys( reply ).indexOf( "messageCount" ) >= 0 ){

					if( reply.messageCount >= self.config.rabbit.maxQueueLength && self.config.rabbit.maxQueueLength !== 0 ){

						// Equal or more than the maximum number of
						// messages in the queue.
						
						self._shouldPause = true;
					}else{
						// Smaller number of messages in the queue.

						// If we're paused, we should unpause.
						if( self._shouldPause ){
							self._shouldPause = false;
							self._counter = 0;
							self.config.inputStream.resume();
						}
					}
				}

				setTimeout( function( ){
					loop( );
				}, self.config.rabbit.checkQueueFrequency );
			} );
		}
	};

	loop();

	return cb( null );
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

	// If we should pause right away ( as in the initial assertQueue came back with
	// our maxQueueLength or more, we should pause the inputStream before we
	// go on to add the event listeners.. This will make sure that we don't end up
	// calling handleIncoming() when we don't want to on startup.
	if( this._shouldPause ){
		this.config.inputStream.pause();
	}

	// At this point we know that we have inputStream ready,
	// we just need to bind some listeners..

	const self = this;
	
	this.config.eventNamesToListenTo.forEach( function( name ){

		if( self._listeners[name] ){
			return self.emit.apply( producerEvents.listenerAlreadyDefinedFor(name) );
		}

		self._listeners[name] = function( comingIn ){
			self.handleIncoming( name, comingIn );
		};

		self.config.inputStream.on( name, self._listeners[name] );
	} );

	// This exists because its possible that we got handed a stream
	// that was already paused; Let's make sure that if we shouldn't
	// pause given our logic, that we aren't paused.
	if( !this._shouldPause ){
		this.config.inputStream.resume();
	}

	// If we should die when the input stream has ended; Let's 
	// listen for that event..
	if( self.config.dieOnEnd ){

		self.config.inputStream.once( "close", function( ){
			self.die();
		} );
	}

	this.emit( producerEvents.running( ) );
};

Producer.prototype.handleIncoming = function( eventName, data ){

	if( this._shouldPause && !this.config.inputStream.isPaused() ){
		this.config.inputStream.pause( );
	}

	// Note that the counter is a runaway control; If we have a particularly fast
	// stream we may want to try and not go too far overboard with our limit.
	// 
	// Without this control, we could have a very fast stream that dumps messages into
	// the queue before our loop checking how many messages are in the queue could catch 
	// that we've gone over.

	// Note that if you want more performance in favour of higher message counts on a queue,
	// or if you're dealing with a steady stream coming in, this could be disabled.

	this._counter++;
	if( this._counter == this.config.rabbit.maxQueueLength && this.config.rabbit.maxQueueLength !== 0 ){
		this._shouldPause = true;
	}

	this._rabbitChannel.sendToQueue( this.config.rabbit.queueName, new Buffer( data ) );
	this.emit( producerEvents.handledData( ) );
};

Producer.prototype.die = function( ){
	const self = this;

	this.emit( producerEvents.dying() );

	if( this._rabbitConnection ){

		// Stop any checking of the queue length
		self._shouldCheckQueueLengthLoop = false;

		async.waterfall( [ function( cb ){

			if( self.config.rabbit.deleteQueueOnDeath ){
				// amqplib is shit for docs; the object of options is required
				// if you want the callback.
				self._rabbitChannel.deleteQueue( self.config.rabbit.queueName, {
					ifUnused: false,
					ifEmpty: false
				}, cb );
				return;
			}
			return cb( null, null );

		}, function( deleteResponse, cb ){

			self._rabbitChannel.waitForConfirms( function( err ){
				return cb( null );
			} );

		}, function( cb ){

			// Close down the connection.
			self._rabbitConnection.close( function( err ){
				self._rabbitConnection = false;
				return cb( null );
			} );
		} ], function( err ){
			// The only error that is possible right here is
			// delete queue.. we don't care at this point.
			// This should be addressed in a future version.
			if( err ){
				self.emit( "error", err );
			}
		} );
	}

	this._listeners.forEach( function( eventName ){
		self.config.inputStream.removeListener( eventName, self._listeners[eventName] );
	} );
	
	// Remove all listeners to this instance of the producer.
	this.removeAllListeners( );
};

module.exports = Producer;
