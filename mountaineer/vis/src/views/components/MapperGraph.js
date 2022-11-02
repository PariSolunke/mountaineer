//react and react hooks
import React,{useState} from 'react';
import { renderD3 } from '../../hooks/render.hook';

//styles
import './styles/MapperGraph.css'

// d3
import * as d3 from 'd3';


const MapperGraph = ({input_projection, lens, mapper_output, dataRange, birefMapperGraph}) => {

  //state to check filtered data
  const [filters,setFilter]=useState({filteredIndices: new Set(), filterStatus: false });

  //Update state when the other component is brushed
  function otherBrushed(selectedIndices, filterStatus){
    let tempObj={filteredIndices:new Set(selectedIndices),filterStatus: filterStatus}
    setFilter(tempObj);
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

  const render_graph = ( chartGroup, xScale, yScale, radiusScale, colorScale, data, svgWidthRange, svgHeightRange) => {
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
      .force("x", d3.forceX(function(d){return xScale(d.xAvg)}))
      .force("y", d3.forceY(function(d){return yScale(d.yAvg)}))
      .force("collide", d3.forceCollide().radius(40).iterations(1));
     
    //links
    let link=chartGroup
      .selectAll(".link-mapper-graph")
      .data(links)
      .enter()
      .append("line")
      .attr("class","link-mapper-graph")  

    //nodes in graph
    let n=chartGroup
      .selectAll('node')
      .data(nodes)
      .enter()
      .append("circle")
      .attr("fill",function(d){
        console.log(d);
        return colorScale(d.lensAvg);
      })
      .attr("class", function(d){
        if (filters.filterStatus){
          if (d.indices.some((element) => {return filters.filteredIndices.has(element)}))
            return "node-mapper-graph";
          else
            return "node-mapper-graph node-mapper-graph-selected";
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
        const svgWidthRange = [0, d3.selectAll('.mapper-graph-container').node().getBoundingClientRect().width - margins.left - margins.right];
        const svgHeightRange = [0, d3.selectAll('.mapper-graph-container').node().getBoundingClientRect().height - margins.top - margins.bottom];
        svgref.node().style.width=d3.selectAll('.mapper-graph-container').node().getBoundingClientRect().width;
        svgref.node().style.height=d3.selectAll('.mapper-graph-container').node().getBoundingClientRect().height;

        //converting the input mapper data into appropriate structure for the graph
        let graphData={nodes:[], links:[]};

        //get names of the nodes
        let nodeNames=Object.keys(mapper_output.nodes);

        //To be used to determine scale for the node radius- minimum and max number of elements in a node in the graph
        let minElements= mapper_output.nodes[nodeNames[0]].length;
        let maxElements=minElements;

        //iterate through every node in the graph
        for(let i=0; i<nodeNames.length;i++){
          let nodeName=nodeNames[i];
          
          let numElements=mapper_output.nodes[nodeName].length;
          let xAvg=0, yAvg=0, lensAvg=0;
          minElements=Math.min(minElements,numElements);
          maxElements=Math.max(maxElements,numElements);
          
          for (let j in mapper_output.nodes[nodeName]){
            xAvg+=input_projection[j][0];
            yAvg+=input_projection[j][1];
            lensAvg+=lens[j];
          }
          
          xAvg=xAvg/numElements;
          yAvg=yAvg/numElements;
          lensAvg=lensAvg/numElements;
          //update the node data
          graphData.nodes.push({id:nodeName, xAvg:xAvg, yAvg:yAvg, lensAvg:lensAvg, numElements:numElements, indices:mapper_output.nodes[nodeName]})

          if (nodeName in mapper_output.links){
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
        const colorScale=d3.scaleLinear().domain([Math.min(lens),Math.max(lens)]).range(['#fee9d4','#7f2704']);
        //render the graph
        render_graph( chartGroup, xScale, yScale, radiusScale, colorScale, graphData, svgWidthRange, svgHeightRange);

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
        //console.log(selectedIndices);
          if(extent)
            birefMapperGraph.parent.onBrush(selectedIndices, "MapperGraph", true);
          else
            birefMapperGraph.parent.onBrush(selectedIndices, "MapperGraph", false);    
        }

    });
  return (
    <>
      <svg ref={ref}></svg>
    </>
  )
}

export default MapperGraph