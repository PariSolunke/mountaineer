//react and react hooks
import React from 'react';
import { renderD3 } from '../../hooks/render.hook';

//styles
import './styles/MapperGraph.css'

// d3
import * as d3 from 'd3';


const MapperGraph = ({input_projection, mapper_output, dataRange}) => {



  //clear plot
  const clear_plot = (svgref) => {
    svgref.selectAll('*').remove();
  }


  
  //render the mapper output plot

  const render_graph = ( chartGroup, xScale, yScale, radiusScale, data, svgWidthRange, svgHeightRange, filter={} ) => {

    let link=chartGroup
      .selectAll(".links-mapper-graph")
      .data(data.links)
      .enter()
      .append("line")
      .style("stroke", "#aaa");

    let node=chartGroup
        .selectAll('.nodes-mapper-graph')
        .data( data.nodes )
        .enter()
        .append("circle")
          .attr("r",  function (d) { return radiusScale(d.numElements)/2; } )
          .attr("cx", 0 )
          .attr("cy",  0 )
          .style("fill", "#69b3a2");

    /*TBD
    let simulation =d3.forceSimulation(data.nodes)
    .force("link", d3.forceLink(data.links).id(d => d.id))
    .force("charge", d3.forceManyBody().strength(-100))
    .force("center", d3.forceCenter(svgWidthRange[1] / 2, svgHeightRange[1] / 2))
    */

  }

  const ref = renderD3( 
    (svgref) => {

        //clear the plot 
        clear_plot(svgref);

        // margins
        const margins = {
            top: 20,
            left:20,
            right: 20,
            bottom: 20
        }

        const chartGroup = svgref
            .append("g")
            .attr("transform", `translate(${margins.left},${margins.top})`);

        // svg dimensions
        const svgWidthRange = [0, d3.selectAll('.mapper-graph-container').node().getBoundingClientRect().width - margins.left - margins.right];
        const svgHeightRange = [0, d3.selectAll('.mapper-graph-container').node().getBoundingClientRect().height - margins.top - margins.bottom];
        svgref.node().style.width=d3.selectAll('.mapper-graph-container').node().getBoundingClientRect().width;
        svgref.node().style.height=d3.selectAll('.mapper-graph-container').node().getBoundingClientRect().height;

        let graphData={nodes:[], links:[]};
        let nodeNames=Object.keys(mapper_output.nodes);
        let minElements= mapper_output.nodes[nodeNames[0]].length;
        let maxElements=minElements;

      
        for(let i=0; i<nodeNames.length;i++){
          let nodeName=nodeNames[i];
          
          let numElements=mapper_output.nodes[nodeName].length;
          let xAvg=0, yAvg=0;
          minElements=Math.min(minElements,numElements);
          maxElements=Math.max(maxElements,numElements);
          
          for (let j in mapper_output.nodes[nodeName]){
            xAvg+=input_projection[j][0];
            yAvg+=input_projection[j][1];
          }
          xAvg=xAvg/numElements;
          yAvg=yAvg/numElements;

          graphData.nodes.push({id:nodeName, xAvg:xAvg, yAvg:yAvg, numElements:numElements, indices:mapper_output.nodes[nodeName]})

          if (nodeName in mapper_output.links){
            for (let target in mapper_output.links[nodeName]){
              graphData.links.push( {source:nodeName, target:mapper_output.links[nodeName][target]});
            }
          }
        }
        
        const xDomain = [ dataRange[0], dataRange[1] ];
        const yDomain = [ dataRange[2], dataRange[3] ] ;
        const xScale = d3.scaleLinear().domain(xDomain).range(svgWidthRange);
        const yScale = d3.scaleLinear().domain(yDomain).range([svgHeightRange[1], svgHeightRange[0]]);
        
        const radiusScale = d3.scaleLinear().domain([minElements,maxElements]).range([10,20]);
        console.log(graphData);
     
        render_graph( chartGroup, xScale, yScale, radiusScale, graphData, svgWidthRange, svgHeightRange);

    });
  return (
    <>
      <svg ref={ref}></svg>
    </>
  )
}

export default MapperGraph