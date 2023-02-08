// react
import React from 'react';

//lasso helpers
import * as selection from "d3-selection";
import * as drag from "d3-drag";
import classifyPoint from "robust-point-in-polygon";

//components
import DataProjection from './components/DataProjection.js';
import MapperGraph from './components/MapperGraph.js';
import DataTable from './components/DataTable.js';
import DistanceMatrix from './components/DistanceMatrix.js';


// styles
import './Mountaineer.css'


const Mountaineer = ({data}) => {

    /*
    // CALLBACK EXAMPLE
    const callback_example = () => {
        console.log('clicking...');
        const callback_function = ( callback_data ) => {
            console.log('CALLBACK DATA: ', callback_data);
        }
        let comm_callback_example = new CommAPI('callback_test', callback_function);
        comm_callback_example.call();
    }
    */
    //calculate the range for the data
    const calculate_data_range = (inputData) => {
        let xmin = inputData[0][0]; 
        let xmax = inputData[0][0];
        let ymin = inputData[0][1]; 
        let ymax = inputData[0][1];
          
        for( let i=1;i<inputData.length;i++){
          xmin=Math.min(xmin,inputData[i][0]);      
          xmax=Math.max(xmax,inputData[i][0]);
          ymin=Math.min(ymin,inputData[i][1]);      
          ymax=Math.max(ymax,inputData[i][1]);   
        }
        return([xmin,xmax,ymin,ymax]);
      }


      //lasso brush function - handles creation of the brush
      let lasso = ()=>{
            let items =[],
                closePathDistance = 75,
                closePathSelect = true,
                isPathClosed = false,
                hoverSelect = true,
                targetArea,
                on = {start: function(){}, draw: function(){}, end: function(){}};
          
            // Function to execute on call
            function lasso(_this) {
          
                // add a new group for the lasso
                let g = _this.append("g")
                    .attr("class","lasso");
          
                // add the drawn path for the lasso
                let dyn_path = g.append("path")
                    .attr("class","drawn");
          
                // add a closed path
                let close_path = g.append("path")
                    .attr("class","loop_close");
          
                // add an origin node
                let origin_node = g.append("circle")
                    .attr("class","origin");
          
                // The transformed lasso path for rendering
                let tpath;
          
                // The lasso origin for calculations
                let origin;
          
                // The transformed lasso origin for rendering
                let torigin;
          
                // Store off coordinates drawn
                let drawnCoords;
          
                 // Apply drag behaviors
                let dragAction = drag.drag()
                    .on("start",dragstart)
                    .on("drag",dragmove)
                    .on("end",dragend);
          
                // Call drag
                targetArea.call(dragAction);
          
                function dragstart() {
                    // Init coordinates
                    drawnCoords = [];
          
                    // Initialize paths
                    tpath = "";
                    dyn_path.attr("d",null);
                    close_path.attr("d",null);
          
                    // Set every item to have a false selection and reset their center point and counters
                    items.nodes().forEach(function(e) {
                        e.__lasso.possible = false;
                        e.__lasso.selected = false;
                        e.__lasso.hoverSelect = false;
                        e.__lasso.loopSelect = false;
          
                        let box = e.getBoundingClientRect();
                        e.__lasso.lassoPoint = [Math.round(box.left + box.width/2),Math.round(box.top + box.height/2)];
                    });
          
                    // if hover is on, add hover function
                    if(hoverSelect) {
                        items.on("mouseover.lasso",function() {
                            // if hovered, change lasso selection attribute to true
                            this.__lasso.hoverSelect = true;
                        });
                    }
          
                    // Run user defined start function
                    on.start();
                }
          
                function dragmove(event) {
                    // Get mouse position within body, used for calculations
                    let x,y;
                    if(event.sourceEvent.type === "touchmove") {
                        x = event.sourceEvent.touches[0].clientX;
                        y = event.sourceEvent.touches[0].clientY;
                    }
                    else {
                        x = event.sourceEvent.clientX;
                        y = event.sourceEvent.clientY;
                    }
          
          
                    // Get mouse position within drawing area, used for rendering
                    let tx = selection.pointer(event, this)[0];
                    let ty = selection.pointer(event, this)[1];
          
                    // Initialize the path or add the latest point to it
                    if (tpath==="") {
                        tpath = tpath + "M " + tx + " " + ty;
                        origin = [x,y];
                        torigin = [tx,ty];
                        // Draw origin node
                        origin_node
                            .attr("cx",tx)
                            .attr("cy",ty)
                            .attr("r",4)
                            .attr("display",null);
                    }
                    else {
                        tpath = tpath + " L " + tx + " " + ty;
                    }
          
                    drawnCoords.push([x,y]);
          
                    // Calculate the current distance from the lasso origin
                    let distance = Math.sqrt(Math.pow(x-origin[0],2)+Math.pow(y-origin[1],2));
          
                    // Set the closed path line
                    let close_draw_path = "M " + tx + " " + ty + " L " + torigin[0] + " " + torigin[1];
          
                    // Draw the lines
                    dyn_path.attr("d",tpath);
          
                    close_path.attr("d",close_draw_path);
          
                    // Check if the path is closed
                    isPathClosed = distance<=closePathDistance ? true : false;
          
                    // If within the closed path distance parameter, show the closed path. otherwise, hide it
                    if(isPathClosed && closePathSelect) {
                        close_path.attr("display",null);
                    }
                    else {
                        close_path.attr("display","none");
                    }
          
                    items.nodes().forEach(function(n) {
                        n.__lasso.loopSelect = (isPathClosed && closePathSelect) ? (classifyPoint(drawnCoords,n.__lasso.lassoPoint) < 1) : false;
                        n.__lasso.possible = n.__lasso.hoverSelect || n.__lasso.loopSelect;
                    });
          
                    on.draw();
                }
          
                function dragend() {
                    // Remove mouseover tagging function
                    items.on("mouseover.lasso",null);
          
                    items.nodes().forEach(function(n) {
                        n.__lasso.selected = n.__lasso.possible;
                        n.__lasso.possible = false;
                    });
          
                    // Clear lasso
                    dyn_path.attr("d",null);
                    close_path.attr("d",null);
                    origin_node.attr("display","none");
          
                    // Run user defined end function
                    on.end();
                }
            }
          
            // Set or get list of items for lasso to select
            lasso.items  = function(_) {
                if (!arguments.length) return items;
                items = _;
                let nodes = items.nodes();
                nodes.forEach(function(n) {
                    n.__lasso = {
                        "possible": false,
                        "selected": false
                    };
                });
                return lasso;
            };
          
            // Return possible items
            lasso.possibleItems = function() {
                return items.filter(function() {
                    return this.__lasso.possible;
                });
            }
          
            // Return selected items
            lasso.selectedItems = function() {
                return items.filter(function() {
                    return this.__lasso.selected;
                });
            }
          
            // Return not possible items
            lasso.notPossibleItems = function() {
                return items.filter(function() {
                    return !this.__lasso.possible;
                });
            }
          
            // Return not selected items
            lasso.notSelectedItems = function() {
                return items.filter(function() {
                    return !this.__lasso.selected;
                });
            }
          
            // Distance required before path auto closes loop
            lasso.closePathDistance  = function(_) {
                if (!arguments.length) return closePathDistance;
                closePathDistance = _;
                return lasso;
            };
          
            // Option to loop select or not
            lasso.closePathSelect = function(_) {
                if (!arguments.length) return closePathSelect;
                closePathSelect = _===true ? true : false;
                return lasso;
            };
          
            // Not sure what this is for
            lasso.isPathClosed = function(_) {
                if (!arguments.length) return isPathClosed;
                isPathClosed = _===true ? true : false;
                return lasso;
            };
          
            // Option to select on hover or not
            lasso.hoverSelect = function(_) {
                if (!arguments.length) return hoverSelect;
                hoverSelect = _===true ? true : false;
                return lasso;
            };
          
            // Events
            lasso.on = function(type,_) {
                if(!arguments.length) return on;
                if(arguments.length===1) return on[type];
                let types = ["start","draw","end"];
                if(types.indexOf(type)>-1) {
                    on[type] = _;
                }
                return lasso;
            };
          
            // Area where lasso can be triggered from
            lasso.targetArea = function(_) {
                if(!arguments.length) return targetArea;
                targetArea = _;
                return lasso;
            }
          
          
          
            return lasso;
      };

    //Whenever brushing interaction occurs in any child component
    const onBrush = (selectedIndices,source, filterStatus) => {
        if (source=="DataProjection"){
            birefMapperGraph1.child.otherBrushed(selectedIndices, filterStatus, source);
            birefMapperGraph2.child.otherBrushed(selectedIndices, filterStatus, source);
            birefDataTable.child.otherBrushed(selectedIndices, filterStatus, source);

        }
        else if (source=="MapperGraph1"|| source=="MapperGraph2"){
            birefDataProj.child.otherBrushed(selectedIndices, filterStatus, source);
            birefDataTable.child.otherBrushed(selectedIndices, filterStatus, source);
            //birefMapperGraph2.child.otherBrushed(selectedIndices, filterStatus);
        }
    }

    //Bidirectional reference object for Data Projection component
    var birefDataProj = {
        parent: {
            onBrush: onBrush
        }
     }
     
     //Bidirectional reference object for Mapper Graph component
    var birefMapperGraph1 = {
        parent: {
            onBrush: onBrush
        }
    }

    var birefMapperGraph2 = {
        parent: {
            onBrush: onBrush
        }
    }

    //Bidirectional reference object for Data table component
    var birefDataTable = {};

    var birefDistMatrix = {};
    
    //combining data, y and lenses into a dataframe
    let dataframe=data.dataframe.map((obj,i) =>{ 
        obj = { ...obj, y: data.y[i]}
        data.lenses.forEach((lens,j) => {
            obj[("lens"+(j+1))]= lens[i];            
        });
        return obj; 
    })

    //generating column names if not provided
    let columns=[]
    if (data.column_names==null)
      columns=Array.from({length: Object.keys(dataframe[0]).length-2}, (_, i) => {return "Feature"+(i + 1)});
    else
      columns=data.column_names
    columns.push("y");
    data.lenses.forEach((lens,index) => {
        columns.push("lens"+(index+1));  
    });

    //range of the input data projection
    const dataRange = calculate_data_range(data.input_projection);

    let minElements, maxElements;

    data.mapper_outputs.forEach((mapper)=>{
        
        for (let node of Object.values(mapper.nodes)){
            if(minElements==null)
                minElements= maxElements= node.length
            else{
                minElements=Math.min(node.length,minElements)
                maxElements= Math.max(node.length,maxElements)
            }
        }
        console.log(minElements,maxElements)

    })

    return (
        <div className='main-wrapper'>
            <div className='viz-wrapper'>
                <div className='data-projection-container'>
                    <DataProjection input_projection={data.input_projection} dataRange={dataRange} birefDataProj={birefDataProj} lasso={lasso}/>
                </div>
                <div className='mapper-graph-container'>
                    <MapperGraph input_projection={data.input_projection} lens={data.lenses} mapper_outputs={data.mapper_outputs} overlaps={data.overlaps} birefMapperGraph={birefMapperGraph1} dataframe={dataframe} columns={columns} lensCount={data.lenses.length} lasso={lasso} minElements={minElements} maxElements={maxElements} mapperId={1}/> 
                </div>
                <div className='mapper-graph-container'>
                    <MapperGraph input_projection={data.input_projection} lens={data.lenses} mapper_outputs={data.mapper_outputs} overlaps={data.overlaps} birefMapperGraph={birefMapperGraph2} dataframe={dataframe} columns={columns} lensCount={data.lenses.length} lasso={lasso} minElements={minElements} maxElements={maxElements} mapperId={2}/> 

                </div>


            </div>
            <div className='datatable-wrapper'>
                <div className='distance-matrix-container'>
                    <DistanceMatrix distance_matrix={data.distance_matrix} birefDistMatrix={birefDistMatrix}/>
                </div>
                <div className='datatable-container'>
                    <DataTable dataframe={dataframe} birefDataTable={birefDataTable} columns={columns} lensCount={data.lenses.length} />
                </div>
            </div>
        </div>
    )

}

export default Mountaineer;

