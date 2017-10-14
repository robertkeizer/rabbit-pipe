const Main	= require( "../" );
const assert	= require( "assert" );

describe( "Main", function( ){
	it( "Is an object", function( ){
		assert.ok( typeof( Main ) == "object" );
	} );

	it( "Contains Producer", function( ){
		assert.ok( typeof( Main.Producer ) == "function" );
	} );
} );
