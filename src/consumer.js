const Joi		= require( "joi" );

const validations	= require( "./validations" )( );

const EventEmitter	= require( "events" ).EventEmitter;
const util		= require( "util" );

const ConsumerEvents	= require( "./events" ).Consumer;
const consumerEvents	= new ConsumerEvents( );

const amqplib		= require( "amqplib/callback_api" );
const async		= require( "async" );

const Consumer = function( config ){

	console.log( "I have config of ");
	console.log( config );
	
	const self = this;
	async.waterfall( [ function( cb ){

		Joi.validate( config, validations.consumerConfig, cb );

	}, function( newConfig, cb ){
	
		// Note that we use newConfig because we might have some defaults defined.
		self.config = newConfig;
		return cb( null );

	}, function( cb ){

		// We want to setup the rabbitmq connection once we've
		// got the config in place.
		self._setupRabbitMQConnection( cb );

	}, function( cb ){
		
		// Let's notify everyone that we're ready to start
		self.emit( consumerEvents.readyToStart( ) );

		// If we have autoStart as true, we should 
		// call start automatically when we're ready.
		if( self.config.autoStart ){
			self.start( );
		}

		return cb( null );
	} ], function( err ){
		if( err ){ throw err; }
	} );
};

util.inherits( Consumer, EventEmitter );

Consumer.prototype._setupRabbitMQConnection = function( cb ){
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
			return cb( err, conn, ch );
		} );

	} ], function( err, conn, ch ){

		if( err ){
			return self.emit( "error", err );
		}

		self._rabbitConnection	= conn;
		self._rabbitChannel	= ch;
		return cb( null );
	} );
};

// This gets called if autoStart is true in the config; It starts a process
// where we read from rabbit and output to the outputStream.
Consumer.prototype.start = function( ){

	if( this._running ){
		return this.emit.apply( this, consumerEvents.startCalledWhenAlreadyRunning( ) );
	}else{
		this._running = true;
	}

	this.emit( consumerEvents.startingUp( ) );

	

	this.emit( consumerEvents.running( ) );
};

Consumer.prototype.die = function( ){
	const self = this;

	this.emit( consumerEvents.dying() );

	if( this._rabbitConnection ){

		// Close down the connection.
		self._rabbitConnection.close( function( err ){
			this._rabbitConnection = false;
		} );
	}
	
	// Remove all listeners to this instance of the consumer.
	this.removeAllListeners( );
};

module.exports = Consumer;
