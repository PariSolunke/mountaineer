//react and react hooks
import React, { useState, useRef } from 'react';
import { renderD3 } from '../../hooks/render.hook';

//styles
import './styles/DataProjection.css'

// d3
import * as d3 from 'd3';

const DataProjection = ({input_projection}) => {


  //clear plot
  const clear_plot = (svgref) => {
    svgref.selectAll('*').remove();
  }

  //calculate the range of input data for scale
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

  //render the scatterplot
  const render_scatterplot = ( chartGroup, xScale, yScale, data, filter={} ) => {

    chartGroup
        .selectAll('.dot')
        .data( data )
        .enter()
        .append("circle")
          .attr("cx", function (d) { return xScale(d[0]); } )
          .attr("cy", function (d) { return yScale(d[1]); } )
          .attr("r", 2)
          .style("fill", "#69b3a2")           
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
        const svgWidthRange = [0, d3.selectAll('.data-projection-container').node().getBoundingClientRect().width - margins.left - margins.right];
        const svgHeightRange = [0, d3.selectAll('.data-projection-container').node().getBoundingClientRect().height - margins.top - margins.bottom];
        
        //finding the data domain and the scale
        const dataRange = calculate_data_range(input_projection);
        const xDomain = [ dataRange[0], dataRange[1] ];
        const yDomain = [ dataRange[2], dataRange[3] ] ;
        const xScale = d3.scaleLinear().domain(xDomain).range(svgWidthRange);
        const yScale = d3.scaleLinear().domain(yDomain).range([svgHeightRange[1], svgHeightRange[0]]);

        render_scatterplot( chartGroup, xScale, yScale, input_projection);
    });

  return (
    <>
      <svg ref={ref}></svg>
    </>
  )
}

export default DataProjection