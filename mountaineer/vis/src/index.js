// react
import React from "react";
import ReactDOM from "react-dom";
import Mountaineer from "./views/Mountaineer";

// third-party libs
import { select } from 'd3-selection'

export function renderMountaineer(divName, data){
	
	// DATA PASSING EXAMPLE
	//console.log('DATA: ', data);
	ReactDOM.render( <Mountaineer data={data}/>, select(divName).node() );
}

//** BROWSER TESTING **//
//ReactDOM.render(<Mountaineer/>, document.querySelector("#root") );
//** ************** **//