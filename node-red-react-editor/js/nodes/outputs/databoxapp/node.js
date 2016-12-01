import React from 'react';
import composeNode from '../../../utils/composeNode';
import Textfield from '../../../components/form/Textfield';
import LayoutManager from './LayoutManager';
import {reducer} from './reducer';
import { bindActionCreators } from 'redux';
import * as LayoutActions from './actions';
import { bindNodeIds, formatSchema } from '../../../utils/utils';
import {LAYOUT_HEIGHT} from './ViewConstants';


function _haveinput(id, inputs){
	for (let i = 0; i < inputs.length; i++){
		if (inputs[i].id === id){
			return true;
		}
	}
	return false;
}

function _havelayout(id, layout){
	for (let i = 0; i < layout.length; i++){
		for (let j = 0; j < layout[i].length; j++){
			if (layout[i][j] === id)
				return true;
		}
	}
	return false;
}

function _findnewinputs(inputs, layout){
	return inputs.filter((input)=>{
		return !_havelayout(input.id, layout);
	}).map((input)=>{
		return input.id;
	});
}

function _findnameforbox(id, inputs){
	
	if (!inputs)
		return id;
	
	for (let i = 0; i < inputs.length; i++){
		if (inputs[i].id === id){
			return inputs[i].name && inputs[i].name.trim() != "" ? inputs[i].name : id; 		
		}
	}
	return id;
}

/* 
 * pull in current layout and add any new inputs / remove old inputs.
 */
 
function _convertlayout(layout, inputs){
	if (!layout){
		return null;
	}
	//remove any items in the layout that are not inputs!
	
	const removed = layout.reduce((acc, row)=>{
		const newrow = row.reduce((acc, box)=>{
			if (_haveinput(box, inputs)){
				acc.push(box);
			}
			return acc;
		},[]);	
		if (newrow.length > 0){
			acc.push(newrow);
		}
		return acc;
	},[]);
	
	const newinputs = _findnewinputs(inputs, removed);

	
	//just add them to a new row.
	if (newinputs.length > 0){
		removed.push(newinputs);
	}
	
	
	return removed.map((row)=>{
	  	return row.map((box)=>{
	  		return {name: _findnameforbox(box, inputs), id: box}
	  	});
	});
}

function _convertinputs(inputs){
	 return [inputs.map((input)=>{return {id: input.id, name: input.name && input.name.trim() != "" ? input.name: input.id}})];
}

class Node extends React.Component {
		
	  constructor(props){
	    	
	  	 super(props);
	  	 const id = props.selected.id; 
	  	 Object.assign(  this, 
              ...bindActionCreators(bindNodeIds(LayoutActions, id), props.dispatch), 
         );
	  	 this._onMouseMove = this._onMouseMove.bind(this);
	  }
	  
	  componentDidMount(){
	  	const boxes = _convertlayout(this.props.selected.layout, this.props.inputs) || _convertinputs(this.props.inputs);
		this.initLayout(boxes);
	  }
      
      render() {
		const NAMEROWHEIGHT = 190;
		const WIDTH = this.props.width;
		const HEIGHT = LAYOUT_HEIGHT;
         
        //local is the stuff in this node's reducer
		const {local, selected, inputs, values, updateNode} = this.props;
    
        const nameprops = {

              id: "name",
             
              value: values.name || "",
             
              onChange: (property, event)=>{
                  updateNode(property, event.target.value);
              },
             
              selected: selected,
        }
          
        const fixedheight = {
          	height: HEIGHT - NAMEROWHEIGHT,
          	WebkitFlex: '0 0 auto',
          	//overflow: 'hidden',
        }
          
        const layoutprops = {
          	w: WIDTH,
          	h: HEIGHT-NAMEROWHEIGHT,
          	mouseDown: this.mouseDown,
          	local: local, 
        }
          
        const mouseprops = {
       		onMouseMove: this._onMouseMove,
       		onMouseUp: this.mouseUp,
       		onDragEnd: this.onDragEnd,
    	}

    	const mousestyle = {
    		position: 'absolute',
    		top: 250 + 40,
       		width: '100%',
       		height: HEIGHT - NAMEROWHEIGHT,
       		overflow: 'hidden',
    	}
        
        return 	<div className="flexcolumn">
          				<div>
          					<div className="flexrow">
								<div className="title">	
									<div className="centered">app name</div>
								</div>
					
								<div>
									<div className="centered">
										<Textfield {...nameprops}/>
									</div>
								</div>
							</div>
						</div>
						<div>
							<div className="flexrow" style={fixedheight}>
								<div>
									<div {...mouseprops} style={mousestyle}>
										<LayoutManager {...layoutprops}/>
									</div>
								</div>
							</div>
						</div>
					</div>						 
       }
       
		_onMouseMove(e){
    		const {clientX, clientY} = e;
    		this.mouseMove(clientX,clientY);
  		}
}

export default composeNode(Node, 'app', 
                            {
                                category: 'outputs',      
                                color: '#d45500',
                                defaults: {             
                                    name: {value:""},
                                    appId: {value:"webapp"},
                                    layout: {value: null},
                                },
                                inputs:1,               
                                outputs:0,             
                               
                                icon: "fa-mobile", 
                                unicode: '\uf10b',       
                                label: function() {     
                                    return this.name||this.topic||"databox app";
                                },
                                
                                schema: ()=>{
                                
                                	const _descriptions = [
                                								{
                                									type: "object", 
                                									description : "format for gauge chart",
                                									properties: {
                                										options: { 
                                													type: "object",
                                													description: "chart options",
                                													properties :{
                                														title : {type:"number", description:"gauge title"},
                                														ticks:  {type:"number", description:"number of values displayed on the gauge"},
                                														min: 	{type:"number", description:"minimum value"},
                                														max: 	{type:"number", description:"maximum value"},
                                														labels: {type:"string", description:"labels along the top of the chart in format name:value,name:value"},
                                													}
                                										},
                                										//TODO: get rid of non-essential attributes 
                                										values: {
                                													type: "object",
                                													description: "chart data",
                                													properties :{
                                														id: 	{type:"string",  description:"id of the dataset"},
                                														type:	{type:"string",  description:"<i>data</i>"}, 
                                														dataid: {type:"string",  description:"id of the data item (eg timestamp)"}, 
                                														x:		{type:"number",  description:"value being measured"},
                                													},
                                													required: ["id", "type","dataid","x"]
                                												}
                                										}
                                								}, 
                                						   		{
                                						   				type: "object",
                                						   				description : "format for bar chart",   
                                						   				properties:{
                                						   							options: {
                                						   								type:"object",
                                						   								description : "chart options",
                                						   								properties: {
                                						   									title : {type:"number", description:"gauge title"},
                                															ticks:  {type:"number",  description:"number of values displayed on the gauge"},
                                															xlabel:  {type:"string",  description:"x-axis label"},
                                															ylabel:  {type:"string",  description:"y-axis label"},
                                															min: 	{type:"number",  description:"minimum axis value"},
                                															max: 	{type:"number",  description:"maximum axis value"},
                                															maxreadings:  {type:"number", description:"maximum number of readings shown on chart"},
                                						   								}
                                						   							}, 
                                						   							values: {
                                						   								type:"object",
                                						   								description : "chart values",
                                						   								properties:{
                                						   									id: 	{type:"string", description:"id of the dataset"},
                                															type:	{type:"string", description:"<i>data</i>"}, 
                                															dataid: {type:"string", description:"id of the data item (eg timestamp)"}, 
                                															x:		{type:"number", description:"x value"},
                                						   									y:		{type:"number", description:"y value"},
                                						   								},
                                						   								required: ["id", "type","dataid","x","y"]
                                						   							}
                                						   				}
                                						   		}, 
                                						   		{
                                						   					type: "object",
                                						   					description : "format for text",    
                    														properties:{
                                						   							values:{
                                						   								type: "string",
                                						   								description: 'some text'
                                						   							}
                                						   					}
                                						   		}, 
                                						   		{
                                						   					type: "object",  
                                						   					description : "format for list",   
                                						   					properties: {
                                						   						values: {
                                						   							type: "object",
                                						   							description : "list values",
                                						   							properties:{
                                						   								timestamp: {type:"ts", description:"a unix timestamp"}, 
                                						   								keys: {type:"array", description:"['key1','key2', '..']"}, 
                                						   								rows:{
																							type: "object",
																							properties:{
																								key: {type:"any", description:"key value pair where key matches key in keys array"}
																							}
                                						   								}
                                						   							}
                                						   						}
                                						   					}
                                						   		},
                                	];
                                
                                	return {
                                			input:{
                                				type:"object",
                                				description: "container object",
                                				properties:{
													sourceId: {type:'string',  description: '<i>[selectedid]</i>'},
													type: {type:'string', description: "one of either \'text\', \'gauge\', \'bar\' or \'list\'", enum:["text", "gauge", "bar", "list"]},
													payload: {
																type: 'object', 
																description: 'the message payload', 
																oneOf: _descriptions.map((item)=>{
																	return item;
																}),
								
													}
												}
                                			}
                                	}
                                },
                                
                                description: ()=> "<p>This component will display data on the databox UI for this app. It can render text, bar and gauge charts and html.  The chartify, webify and listify nodes can feed directly into this node.  Each node that feeds into this node will be displayed as a dark box below (with the id of the node or its name).  You can drag the boxes around to determine the layout of each node in the UI</p>", 

                                labelStyle: function() { 
                                    return this.name?"node_label_italic":"";
                                }
                            }, reducer
                          );