const Main	= require( "../" );
const assert	= require( "assert" );
const Tasks	= require( "./tasks" );

const stream	= require( "stream" );
const events	= require( "events" );

const ProducerEvents	= require( "../src/events" ).Producer;
const producerEvents	= new ProducerEvents( );

const event2stream	= require( "event2stream" );

describe( "Producer", function( ){
	it( "Is a function", function( ){
		assert.ok( typeof( Main.Producer ) == "function" );
	} );

	it( "Throws an error if config not specified", function( ){
		assert.throws( function( ){
			const p = new Main.Producer( );
		} );
	} );

	it( "Doesn't throw an error if config is passed in", function( cb ){
		const tasks = new Tasks( );
		const p = new Main.Producer( tasks.validSpecProducerConfig( { waitForReadyListener: true } ) );
		p.once( producerEvents.readyToStart( ), function( ){
			p.die();
			return cb( null );
		} );
	} );

	it( "The Producer inherits from the event emitter", function( cb ){
		const tasks = new Tasks( );
		const p = new Main.Producer( tasks.validSpecProducerConfig( { waitForReadyListener: true } ) );
		assert.ok( p instanceof events.EventEmitter );
		p.once( producerEvents.readyToStart(), function( ){
			p.die();
			return cb( null );
		} );
	} );

	it( "The producer emits a ready to start event when ready to start", function( cb ){
		const tasks = new Tasks( );
		const p = new Main.Producer( tasks.validSpecProducerConfig( { waitForReadyListener: true } ) );
		p.once( producerEvents.readyToStart( ), function( ){
			p.die();
			return cb( null );
		} );
	} );

	it( "The producer emits a starting up event", function( cb ){
		const tasks = new Tasks( );
		const p = new Main.Producer( tasks.validSpecProducerConfig( {
			waitForReadyListener: true,
			autoStart: true
		 } ) );

		// While we don't care about this, it allows us to make sure that we
		// have the starting up listener attached properly.
		p.once( producerEvents.readyToStart(), function( ){ } );

		p.once( producerEvents.startingUp( ), function( ){
			p.die();
			return cb( null );
		} );
	} );

	describe( "Start", function( ){

		// Need to come back to; should emit an error based on 
		// producerEvents.startCalledWhenAlreadyRunning
		it( "Calling .start fails if its already running", function( cb ){
			const tasks = new Tasks( );
			const p = new Main.Producer( tasks.validSpecProducerConfig( {
				waitForReadyListener: true,
				autoStart: true,
				eventNamesToListenTo: [ "line" ]
			} ) );
			p.once( producerEvents.readyToStart( ), function( ){ } );
			p.once( producerEvents.running( ), function( ){
				p.start( );
			} );
			p.once( "error", function( err ){
				assert.equal( err, producerEvents.startCalledWhenAlreadyRunning( )[1] );
				p.die();
				return cb( null );
			} );
		} );

		it( "Emits a running if we're good to go.", function( cb ){
			const tasks = new Tasks( );
			const p = new Main.Producer( tasks.validSpecProducerConfig( {
				waitForReadyListener: true,
				autoStart: true,
				eventNamesToListenTo: [ "line" ]
			} ) );
			p.once( producerEvents.readyToStart( ), function( ){ } );
			p.once( producerEvents.running( ), function( ){
				p.die();
				return cb( null );
			} );
		} );

		it( "Adds records to the queue as appropriate", function( cb ){

			const _ee = new events.EventEmitter( );

			const myStream = new event2stream( {
				eventEmitter: _ee,
				eventNames: [ "data" ]
			} );

			for( var k=0; k<1000; k++ ){
				_ee.emit( "data", "Some Data" );
			}

			const tasks = new Tasks( );
			const p = new Main.Producer( tasks.validSpecProducerConfig( {
				waitForReadyListener: true,
				autoStart: true,
				eventNamesToListenTo: [ "data" ],
				inputStream: myStream,
				rabbit: {
					deleteQueueOnDeath: true
				}
			} ) );
			p.once( producerEvents.readyToStart( ), function( ){ } );
			p.once( producerEvents.handledData( ), function( ){
				p.die( );
				return cb( null );
			} );
		} );

		it.skip( "Properly limits the rabbit queue.", function( cb ){

			const _ee = new events.EventEmitter( );

			const myStream = new event2stream( {
				eventEmitter: _ee,
				eventNames: [ "data" ]
			} );

			const _add_thousand = function( ){
				for( var k=0; k<1000; k++ ){
					_ee.emit( "data", "Some Data" );
				}
			};

			_add_thousand( );
			setTimeout( function( ){
				_add_thousand( );
			}, 1000 );

			const tasks = new Tasks( );
			const p = new Main.Producer( tasks.validSpecProducerConfig( {
				waitForReadyListener: true,
				autoStart: true,
				eventNamesToListenTo: [ "data" ],
				inputStream: myStream,
				rabbit: {
					maxQueueLength: 1000,
					checkQueueFrequency: 10,
					deleteQueueOnDeath: true
				}
			} ) );
			p.once( producerEvents.readyToStart( ), function( ){ } );
			p.once( producerEvents.handledData( ), function( ){
				setTimeout( function( ){
					p.die( );
					return cb( null );
				}, 4000 );
			} );
		} );
	} );
} );
