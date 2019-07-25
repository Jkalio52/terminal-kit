/*
	Terminal Kit

	Copyright (c) 2009 - 2019 Cédric Ronvel

	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



const Element = require( './Element.js' ) ;
const BaseMenu = require( './BaseMenu.js' ) ;
const ColumnMenu = require( './ColumnMenu.js' ) ;
const Button = require( './Button.js' ) ;



// Inherit from ColumnMenu for common methods

const defaultMaster = {
	content: 'select-list' ,
	symbol: '▼' ,
	internalRole: 'toggle'
} ;

const defaultSeparator = {
	content: '-' ,
	contentRepeat: true ,
	internalRole: 'separator'
} ;



function SelectList( options = {} ) {
	if ( ! options.master || typeof options.master !== 'object' ) {
		options.master = Object.assign( {} , defaultMaster ) ;
	}
	else {
		options.master = Object.assign( {} , defaultMaster , options.master ) ;
	}

	if ( options.content ) {
		options.master.content = options.content ;
	}

	if ( ! options.separator || typeof options.separator !== 'object' ) {
		options.separator = Object.assign( {} , defaultSeparator ) ;
	}
	else {
		options.separator = Object.assign( {} , defaultSeparator , options.separator ) ;
	}

	ColumnMenu.call( this , options ) ;

	this.show = false ;
	this.zIndexRef = this.zIndex ;	// Back-up for zIndex

	if ( options.value !== undefined && this.setValue( options.value , true ) ) {
		// .initPage() is called by .setValue() only when a correct value was found
		this.toggle( this.show , options.noDraw ) ;
	}
	else {
		this.initPage() ;
		this.toggle( this.show , options.noDraw ) ;
	}


	this.onClickOut = this.onClickOut.bind( this ) ;

	this.on( 'clickOut' , this.onClickOut ) ;

	// Only draw if we are not a superclass of the object
	if ( this.elementType === 'SelectList' && ! options.noDraw ) { this.draw() ; }
}

module.exports = SelectList ;

SelectList.prototype = Object.create( ColumnMenu.prototype ) ;
SelectList.prototype.constructor = SelectList ;
SelectList.prototype.elementType = 'SelectList' ;



SelectList.prototype.destroy = function( isSubDestroy ) {
	this.off( 'clickOut' , this.onClickOut ) ;

	ColumnMenu.prototype.destroy.call( this , isSubDestroy ) ;
} ;



SelectList.prototype.toggle = function( show = null , noDraw = false ) {
	var i , iMax ;

	if ( show === null ) { this.show = ! this.show ; }
	else { this.show = !! show ; }

	for ( i = 1 , iMax = this.buttons.length ; i < iMax ; i ++ ) {
		this.buttons[ i ].hidden = ! this.show ;
	}

	// Adjust outputHeight, to avoid the list to be clickable when reduced
	this.outputHeight = this.show ? this.pageHeight : 1 ;

	if ( this.show ) { this.topZ() ; }
	else { this.restoreZ() ; }

	// Return now if noDraw is set, bypassing both drawing and focus
	if ( noDraw ) { return ; }

	if ( show ) {
		for ( i = 1 , iMax = this.buttons.length ; i < iMax ; i ++ ) {
			if ( this.buttons[ i ].value === this.value ) {
				this.document.giveFocusTo( this.buttons[ i ] ) ;
				break ;
			}
		}
	}
	else {
		this.document.giveFocusTo( this.buttons[ 0 ] ) ;
	}

	this.redraw() ;
} ;



// selectOnly: don't draw, don't toggle
SelectList.prototype.select = function( button , selectOnly ) {
	// /!\ Warning! button can be a button (called from .onButtonSubmit()) or a buttonDef (called from .setValue()) /!\
	// This is nasty an should be fixed!
	// Ideally, a button should retain a 'def' pointer
	var width = Element.computeContentWidth( button.content , button.contentHasMarkup ) + this.buttonPaddingWidth + this.buttonSymbolWidth ;

	if ( width < this.buttonsMaxWidth ) {
		this.masterDef.buttonContent = button.content + ' ' + ' '.repeat( this.buttonsMaxWidth - width ) + this.masterDef.symbol ;
	}
	else {
		this.masterDef.buttonContent = button.content + ' ' + this.masterDef.symbol ;
	}

	this.masterDef.contentHasMarkup = button.contentHasMarkup ;
	this.masterDef.width = this.buttonsMaxWidth ;
	this.value = this.masterDef.value = button.value ;

	// Only when it's a buttonDef ATM:
	if ( button.page !== undefined ) { this.page = button.page ; }

	this.initPage() ;

	if ( selectOnly ) { return ; }

	this.toggle( false ) ; // , noDraw ) ;
} ;



SelectList.prototype.onButtonSubmit = function( buttonValue , trash , button ) {
	switch ( button.internalRole ) {
		case 'previousPage' :
			this.previousPage() ;
			break ;
		case 'nextPage' :
			this.nextPage() ;
			break ;
		case 'toggle' :
			this.toggle() ;
			break ;
		default :
			this.select( button ) ;
			this.emit( 'submit' , buttonValue , undefined , this ) ;
	}
} ;



// .setValue() will also select the first matching item
SelectList.prototype.setValue = function( value , noDraw ) {
	var buttonDef = this.itemsDef.find( b => b.value === value ) ;
	if ( ! buttonDef ) { return false ; }
	this.select( buttonDef , noDraw ) ;
	return true ;
} ;



SelectList.prototype.onClickOut = function() { this.toggle( false ) ; } ;
SelectList.prototype.getValue = function() { return this.value ; } ;
