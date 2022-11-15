//react and react hooks
import React,{useState} from 'react';
import { renderD3 } from '../../hooks/render.hook';

//styles
import './styles/MapperGraph.css'

// d3
import * as d3 from 'd3';


const MapperGraph = ({ mapper_outputs, overlaps, dataRange, birefMapperGraph, dataframe, columns, lensCount}) => {

  //state to check filtered data
  const [state,setState]=useState({filteredIndices: new Set(), filterStatus: false, selectedMapper:0, nodeColorBy:"lens1", nodeColorAgg:"mean"});
  let mapper_output=mapper_outputs[state.selectedMapper];
  let overlap=overlaps[state.selectedMapper];

  //Update state when the other component is brushed
  function otherBrushed(selectedIndices, filterStatus){
    setState((prevState)=>({...prevState, filteredIndices :new Set(selectedIndices), filterStatus: filterStatus}));
  } 
  
  //Bidirectional reference object to enable two way communication between parent and child component
  birefMapperGraph.child={
      otherBrushed: otherBrushed
  };
  
  //selected indices for brushing
  let selectedIndices=new Set();

  //Brushing helper
  function isBrushed(brush_coords, cx, cy) {
    let x0 = brush_coords[0][0],
        x1 = brush_coords[1][0],
        y0 = brush_coords[0][1],
        y1 = brush_coords[1][1];
   return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;    
  }


  //clear plot
  const clear_plot = (svgref) => {
    svgref.selectAll('*').remove();
  }  
  //render the mapper output plot

  const render_graph = ( chartGroup, xScale, yScale, radiusScale, colorScale, opacityScale, data, svgWidthRange, svgHeightRange) => {
    //creating copies of the data 
    let nodes = JSON.parse(JSON.stringify(data.nodes));
    let links = JSON.parse(JSON.stringify(data.links));
    
    //force layout graph
    let simulation =d3.forceSimulation(nodes)
      .on('tick',onTick)
      .force("link", d3.forceLink()                              
        .id(function(d) { return d.id; })                     
        .links(links)
        .distance(250))
        .force("center", d3.forceCenter(svgWidthRange[1]/2,svgHeightRange[1]/2))
        .force("collide", d3.forceCollide().radius(35).iterations(1));
     
    //links
    let link=chartGroup
      .selectAll(".link-mapper-graph")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke-opacity", function(d){
        return (opacityScale(overlap[d.source.id]));
    
      })
      .attr("class","link-mapper-graph")  

    //nodes in graph
    let n=chartGroup
      .selectAll('node')
      .data(nodes)
      .enter()
      .append("circle")
      .attr("fill",function(d){
        return colorScale(d.colorVal);
      })
      .attr("class", function(d){
        if (state.filterStatus){
          if (d.indices.some((element) => {return state.filteredIndices.has(element)}))
            return "node-mapper-graph node-mapper-graph-selected";
          else
            return "node-mapper-graph node-mapper-graph-unselected";
        }
        else
          return "node-mapper-graph";
        
      })
      .attr("r", d=>{return radiusScale(d.numElements);})
      
    function onTick() {
      //update the node positions
      n.attr('cx', function(d) { return d.x; })
          .attr('cy', function(d) { return d.y; })
      
      //update link positions
      link.attr('x1', function(d) { return d.source.x; })
          .attr('y1', function(d) { return d.source.y; })
          .attr('x2', function(d) { return d.target.x; })
          .attr('y2', function(d) { return d.target.y; });
    }

  }

  const ref = renderD3( 
    (svgref) => {

        //clear the plot 
        clear_plot(svgref);

        // margins
        const margins = {
            top: 15,
            left:15,
            right: 15,
            bottom: 15
        }

        //appending group to svgref
        const chartGroup = svgref
            .append("g")
            .attr("transform", `translate(${margins.left},${margins.top})`);

        //group for brushing
        const brushGroup=chartGroup.append("g");


        // svg dimensions
        const svgWidthRange = [0, d3.selectAll('.svg-container').node().getBoundingClientRect().width - margins.left - margins.right];
        const svgHeightRange = [0, d3.selectAll('.svg-container').node().getBoundingClientRect().height - margins.top - margins.bottom];
        svgref.node().style.width=d3.selectAll('.svg-container').node().getBoundingClientRect().width;
        svgref.node().style.height=d3.selectAll('.svg-container').node().getBoundingClientRect().height;

        //converting the input mapper data into appropriate structure for the graph
        let graphData={nodes:[], links:[]};

        //get names of the nodes
        let nodeNames=Object.keys(mapper_output.nodes);

        //To be used to determine scale for the node radius- minimum and max number of elements in a node in the graph
        let minElements= mapper_output.nodes[nodeNames[0]].length;
        let maxElements=minElements;
        let colorMinAvg,colorMaxAvg;
        let opacityExtent=[];

        //iterate through every node in the graph
        for(let i=0; i<nodeNames.length;i++){
          let nodeName=nodeNames[i];

          let numElements=mapper_output.nodes[nodeName].length;
          let colorVal=0;
          minElements=Math.min(minElements,numElements);
          maxElements=Math.max(maxElements,numElements);
          
          //find the colorValue for each node based on selected aggregation
          colorVal= findColorVal(mapper_output.nodes[nodeName], numElements);
          if(!colorVal)
            colorVal=0;      
          if (!colorMinAvg){
            colorMinAvg = colorVal;
            colorMaxAvg = colorVal;  
          }
          colorMinAvg= Math.min(colorMinAvg, colorVal);
          colorMaxAvg= Math.max(colorMaxAvg, colorVal);


          //update the node data
          graphData.nodes.push({id:nodeName, colorVal:colorVal, numElements:numElements, indices:mapper_output.nodes[nodeName]})
          if (nodeName in mapper_output.links){
            if(opacityExtent.length==0){
              opacityExtent=d3.extent(overlap[nodeName]);
            }
            else{
              let curExtent=d3.extent(overlap[nodeName]);
              opacityExtent[0]=Math.min(opacityExtent[0],curExtent[0]);
              opacityExtent[1]=Math.max(opacityExtent[1],curExtent[1]);
            }
            for (let target in mapper_output.links[nodeName]){
              //update the link data
              graphData.links.push( {source:nodeName, target:mapper_output.links[nodeName][target]});
            }
          }
        }
        
        //the mapper output will be projected along the same dimensions as the input projection
        const xDomain = [ dataRange[0], dataRange[1] ];
        const yDomain = [ dataRange[2], dataRange[3] ] ;

        //scales for x and y positions, color, and radii of the nodes
        const xScale = d3.scaleLinear().domain(xDomain).range(svgWidthRange);
        const yScale = d3.scaleLinear().domain(yDomain).range([svgHeightRange[1], svgHeightRange[0]]);
        const radiusScale = d3.scaleLinear().domain([minElements,maxElements]).range([10,20]);
        const colorScale=d3.scaleLinear().domain([colorMinAvg,colorMaxAvg]).range(['#FFE0B2','#FB8C00']);
        const opacityScale=d3.scaleLinear().domain(opacityExtent).range([0.1,1]);

        //render the graph
        render_graph( chartGroup, xScale, yScale, radiusScale, colorScale, opacityScale, graphData, svgWidthRange, svgHeightRange);

        //add brush
        let brush=d3.brush()
          .extent( [ [0,0], [svgWidthRange[1],svgHeightRange[1]]])
          .on('end', handleBrush);
        
        brushGroup.call(brush);

        //handle Brushing
        function handleBrush(e) {
          let nodes=chartGroup.selectAll('.node-mapper-graph');
          nodes.classed("node-mapper-graph-selected", false);
          selectedIndices.clear();
          let extent = e.selection;
          nodes.attr("class", function(d,i){
                                                    if(extent && isBrushed(extent, d.x, d.y )){
                                                      for(let i=0;i<d.indices.length;i++){
                                                        selectedIndices.add(d.indices[i]);
                                                      }
                                                      return "node-mapper-graph";
                                                    }
                                                    if(!extent)
                                                      return "node-mapper-graph";
                                                    else  
                                                      return "node-mapper-graph node-mapper-graph-unselected"; } );
        //colorVallog(selectedIndices);
          if(extent)
            birefMapperGraph.parent.onBrush(selectedIndices, "MapperGraph", true);
          else
            birefMapperGraph.parent.onBrush(selectedIndices, "MapperGraph", false);    
        }


      //function to find the colorValue for node based on user selection
      function findColorVal(curIndices, numElements){
        //mean
        if (state.nodeColorAgg=='mean'){
          let returnValue=0;
          curIndices.forEach(j => {
              returnValue+=dataframe[j][state.nodeColorBy];
          });
          returnValue=returnValue/numElements;
          return returnValue;
        }

        //max
        else if (state.nodeColorAgg=='max'){
          let returnValue;
          curIndices.forEach(j => {
            if (!returnValue)
              returnValue=dataframe[j][state.nodeColorBy];
            else
              returnValue=Math.max(returnValue, dataframe[j][state.nodeColorBy]);
          });
          return returnValue;
        }

        //min
        else if (state.nodeColorAgg=='min'){
          let returnValue;
          curIndices.forEach(j => {
            if (!returnValue)
              returnValue=dataframe[j][state.nodeColorBy];
            else
              returnValue=Math.min(returnValue, dataframe[j][state.nodeColorBy]);
          });
          return -1*returnValue; 
        }

        //median
        else if (state.nodeColorAgg=='median'){
          let valArray=[];
          let returnValue;
          curIndices.forEach(j => {
              valArray.push(dataframe[j][state.nodeColorBy]);
          });
          valArray.sort();  
          if (numElements%2!=0)
            return valArray[((numElements+1)/2 - 1)];
          else
            return (valArray[(numElements/2 - 1)]+valArray[(numElements/2)])/2;    
        }

        else{
          let valArray=[];
          curIndices.forEach(j => {
            valArray.push(dataframe[j][state.nodeColorBy]);
          });
          
          //variance or SD
          if (state.nodeColorAgg=='var')  
            return getVariance(valArray);
          else
            return Math.sqrt(getVariance(valArray));   
          
          //calculate variance of an array
          function getVariance (valArr) {
            const n = valArr.length
            const mean = valArr.reduce((a, b) => a + b) / n
            return valArr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
          }  
      }
      
      }

    });

    //on change of selected mapper
    const changeSelectedMapper = (event) => {
      setState((prevState)=>({...prevState, selectedMapper:event.target.value}));
    };

    //on change of node feature to color by
    const changeNodeColorFeature = (event) => {
      setState((prevState)=>({...prevState, nodeColorBy:event.target.value}));
    };


    //on change of aggregation method
    const changeNodeColorAgg = (event) => {
      setState((prevState)=>({...prevState, nodeColorAgg:event.target.value}));
    };

  return (
    <>
      <div className='mapper-selection-container'>

        <div>
          <label htmlFor="mapperSelect">Mapper:&nbsp;</label>
          <select value={state.selectedMapper} id="mapperSelect"  onChange={changeSelectedMapper}>
            <option value="0">Mapper 1</option>
            <option value="1">Mapper 2</option>
          </select>
        </div>
        <div>
          <label htmlFor='nodeColorBy'>Node Color:&nbsp;</label>
          <select value={state.nodeColorBy} id="nodeColorBy"  onChange={changeNodeColorFeature}>
              {columns.map((column,i) => (
                i<columns.length-(lensCount+1)?
                <option value={i}>{column}</option>
                :<option value={column}>{column}</option>
                ))}
          </select>
        </div>
        <div>
          <label htmlFor="nodeColorAgg">Aggregation:&nbsp;</label>
          <select value={state.nodeColorAgg} id="nodeColorAgg"  onChange={changeNodeColorAgg}>
            <option value="mean">Mean</option>
            <option value="median">Median</option>
            <option value="sd">Standard Deviation</option>
            <option value="var">Variance</option>
            <option value="max">Max</option>
            <option value="min">Min</option>
          </select>
        </div>


      </div>
      <div className='svg-container'>
      <svg ref={ref}></svg>
      </div>
    </>
  )
}

export default MapperGraph