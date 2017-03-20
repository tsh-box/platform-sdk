import React from 'react';
import { render } from 'react-dom';
import {actionConstants as nodeActionTypes} from "./constants";
import { NODE_WIDTH, MOUSE_X_OFFSET, MOUSE_Y_OFFSET} from 'constants/ViewConstants';
import {getID, addViewProperties, lookup} from 'utils/nodeUtils';
import {calculateTextWidth, toggleItem} from 'utils/utils';
import {scopeify} from 'utils/scopeify';
import {register,unregisterAll} from 'app/store/configureStore';
import {actionCreators as portActions} from 'features/ports';




function loadNode({store,component,node,reducer}){
  return function(dispatch, getState){
      const _node = Object.assign({},node);
      addViewProperties(_node);
    
      if (reducer){
        register(store, _node.id, scopeify(_node.id, reducer));
      }

      dispatch({type: nodeActionTypes.NODE_DROPPED, node: _node});

      const elementprops = {
        store: store,
        id: node.id,
      }

      const element = React.createElement(component, {...elementprops});
      const g = document.createElement('div');
      g.id = `config-${node.id}`;
      document.body.appendChild(g);
      render(element, document.getElementById(`config-${node.id}`));
  };
}

function _schema(def){
  if (def.schemakey){
      const key = def.defaults[def.schemakey];
      if (key && key.value){
          if (def.schemafn){
              return def.schemafn(key.value);
          }
      }
  }
  return def.schemafn ? def.schemafn() : {}
}

function dropNode({store, component, nt, def, reducer}, x0, y0){
  
  return function(dispatch, getState){
    //adjust x and y for offsets
    const x = x0 + MOUSE_X_OFFSET + NODE_WIDTH/2;
    const y = y0 + MOUSE_Y_OFFSET + getState().mouse.top + NODE_WIDTH/2;

    if (x < 0){
      console.log("failed to drop node!");
      return;
    }

    let _def = Object.assign({},def);
    
    const node = {
      id: getID(),
      z:getState().workspace.current.id,
      type: nt,
      _def: _def,
      _: (id)=>{return id},
      inputs: _def.inputs || 0,
      outputs: _def.outputs,
      schema: _schema(_def),
      changed: true,
      selected: true,
      dirty: true,
      x: x, 
      y: y, 
    }
 
    //so old nodes that are loaded won't necessarily have the new defaults!
    for (var d in node._def.defaults) {
      if (node._def.defaults.hasOwnProperty(d)) {
        node[d] = node._def.defaults[d].value;
      }
    }

    addViewProperties(node);
    
    //might need to make this a separate action?
    //register this reducer and force nodeid to be passed in when state changes.  scopeify will ignore any actions that do not have this node's id as a parameter
    //this means that instances of the same node can trasparently make use of the same action constants without a clash!.
    if (reducer){
      register(store, node.id, scopeify(node.id, reducer));
    }
    

    dispatch({type: nodeActionTypes.NODE_DROPPED, node: node});

    //THIS IS WHERE WE RENDER THE CONFIG PROPS!

    //think this is where we render!!
    const elementprops = {
        store: store,
        id: node.id,
    }

 
     
    const element = React.createElement(component, {...elementprops});
    //console.log("create element");
    //console.log(element);
    const g = document.createElement('div');
    g.id = `config-${node.id}`;
    document.body.appendChild(g);
    render(element, document.getElementById(`config-${node.id}`));
    //dispatch(editorActions.closeAll());
  }
}

function initNodeKeys(keys){
  return {
    type: nodeActionTypes.NODE_INIT_VALUES,
    keys
  }
}

function updateNode(property, value){
  return {
    type: nodeActionTypes.NODE_UPDATE_VALUE,
    property,
    value,
  }
}

function updateNodeValueKey(property, key, value){

  return {
    type: nodeActionTypes.NODE_UPDATE_VALUE_KEY,
    property,
    key,
    value,
  }
}

function incrementNodeValueKey(property, key, amount, min, max){
  return {
    type: nodeActionTypes.NODE_INCREMENT_VALUE_KEY,
    property,
    key,
    amount,
    min,
    max,
  }
}

function updateSchema(id, schema){
  return {
    type: nodeActionTypes.NODE_UPDATE_SCHEMA,
    id,
    schema,
  }
}


function nodeMouseDown(id){
     
  return function(dispatch, getState){
  
    dispatch(portActions.linkDeselected());
  
    dispatch ({
        type: nodeActionTypes.NODE_MOUSE_DOWN,
        id
    })
  }
} 

function nodeDoubleClicked(id){

  //TODO: WHY TWO EVENTS HERE?
  return function(dispatch, getState) {

    dispatch({
      type: nodeActionTypes.NODE_DOUBLE_CLICKED,
      id,
    });
    
    dispatch({
      type: nodeActionTypes.NODE_CONFIGURE,
      id
    });

  }
} 

function nodeConfigureOk(){
    
    return {
      type: nodeActionTypes.NODE_CONFIGURE_OK,
    }
} 

function nodeConfigureCancel(){
    return {
      type: nodeActionTypes.NODE_CONFIGURE_CANCEL,
    }
}

function nodeDelete(){
    return {
      type: nodeActionTypes.NODE_DELETE,
    }
}

function clearNodes(store){
  unregisterAll(store);
  return {
      type: nodeActionTypes.NODE_CLEAR_ALL,
  }
}

function nodeDeselected(){
  return {
      type: nodeActionTypes.NODE_DESELECTED,
  }
}


function deleteTab(id){
    return {
        type: nodeActionTypes.TAB_DELETE,
        id
    }
}

function mouseMove(x,y){
  return {
     type: nodeActionTypes.MOUSE_MOVE,
     x,
     y,
  }
}

function mouseUp(){
    return {
      type:nodeActionTypes.MOUSE_UP,
    }
}



function receiveFlows(store, nodes){
  
  return ((dispatch, getState)=>{
    
      const lookuptype = lookup.bind(null,getState().palette.types)
      const _nodes = nodes.map((node)=>{
          const {component,reducer} = lookuptype(node.type)
         dispatch(loadNode({store, component, node, reducer}));
      });
  });
 
  return {
      type: nodeActionTypes.RECEIVE_FLOWS,
      nodes,
  }
}


export const actionCreators = {
  dropNode,
  initNodeKeys,
  updateNode,
  clearNodes,
  updateNodeValueKey,
  incrementNodeValueKey,
  updateSchema,
  nodeMouseDown,
  nodeDoubleClicked,
  nodeConfigureOk,
  nodeConfigureCancel,
  deleteTab,
  mouseMove,
  mouseUp,
  nodeDelete,
  nodeDeselected,
  receiveFlows,
}