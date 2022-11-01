//react
import React, {useEffect, useState} from 'react';

//reference to renderD3 hook
import { renderD3 } from '../../hooks/render.hook';

//styles
import './styles/DataProjection.css'

// d3
import * as d3 from 'd3';

const DataProjection = ({input_projection, dataRange, birefDataProj}) => {

  const [filter,setFilter]=useState(() => new Set());

  function otherBrushed(message){
    console.log(message);
  } 
  


birefDataProj.child={
      otherBrushed: otherBrushed
};

  let selectedIndices=new Set();

  function isBrushed(brush_coords, cx, cy) {
    let x0 = brush_coords[0][0],
        x1 = brush_coords[1][0],
        y0 = brush_coords[0][1],
        y1 = brush_coords[1][1];
   return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;    // This return TRUE or FALSE depending on if the points is in the selected area
  }

  //clear plot
  const clear_plot = (svgref) => {
    svgref.selectAll('*').remove();
  }


  //render the scatterplot
  const render_scatterplot = ( chartGroup, xScale, yScale, data, width, height ) => {

    let nodes=chartGroup
        .selectAll('node')
        .data( data )
        .enter()
        .append("circle")
          .attr("class",function(d,i){
            if (filter.has(i)){
              return "nodes-input-projection nodes-input-projection-filtered";
            }
            else{
              return "nodes-input-projection nodes-input-projection-unselected";
            }
          })
          .attr("cx", function (d) { return xScale(d[0]); } )
          .attr("cy", function (d) { return yScale(d[1]); } )
          .attr("r", 2)

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

        let brushGroup=chartGroup.append("g");

        // svg dimensions
        const svgWidthRange = [0, d3.selectAll('.data-projection-container').node().getBoundingClientRect().width - margins.left - margins.right];
        const svgHeightRange = [0, d3.selectAll('.data-projection-container').node().getBoundingClientRect().height - margins.top - margins.bottom];
        svgref.node().style.width=d3.selectAll('.data-projection-container').node().getBoundingClientRect().width;
        svgref.node().style.height=d3.selectAll('.data-projection-container').node().getBoundingClientRect().height;

        //finding the data domain and the scale
        const xDomain = [ dataRange[0], dataRange[1] ];
        const yDomain = [ dataRange[2], dataRange[3] ] ;
        const xScale = d3.scaleLinear().domain(xDomain).range(svgWidthRange);
        const yScale = d3.scaleLinear().domain(yDomain).range([svgHeightRange[1], svgHeightRange[0]]);

        render_scatterplot( chartGroup, xScale, yScale, input_projection);

                  
        let brush=d3.brush()
          .extent( [ [0,0], [svgWidthRange[1],svgHeightRange[1]]])
          .on('end', handleBrush);
        brushGroup.call(brush);

        function handleBrush(e) {
          let nodes=chartGroup.selectAll('.nodes-input-projection');
          nodes.classed("nodes-input-projection-unselected", false);
          selectedIndices.clear();
          let extent = e.selection;
          console.log(extent);
          nodes.attr("class", function(d,i){ 
                                                    if(extent && isBrushed(extent, xScale(d[0]), yScale(d[1]) )){
                                                      selectedIndices.add(i);
                                                      return "nodes-input-projection nodes-input-projection-selected";
                                                    }
                                                    return "nodes-input-projection nodes-input-projection-unselected"; } );
          if(extent){
            birefDataProj.parent.onBrush(selectedIndices, "SELECTED");
            let a=1;
          }
          else{
            birefDataProj.parent.onBrush(selectedIndices, "SELECTION CANCELLED");
            let a=1;
          }
      
        }
        
    

    });

  return (
    <>
      <svg ref={ref}></svg>
    </>
  )
}

export default DataProjection