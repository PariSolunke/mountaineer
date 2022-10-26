//react
import React from 'react';

//reference to renderD3 hook
import { renderD3 } from '../../hooks/render.hook';

//styles
import './styles/DataProjection.css'

// d3
import * as d3 from 'd3';

const DataProjection = ({input_projection, dataRange}) => {


  //clear plot
  const clear_plot = (svgref) => {
    svgref.selectAll('*').remove();
  }

  //calculate the range of input data for scale

  //render the scatterplot
  const render_scatterplot = ( chartGroup, xScale, yScale, data, filter={} ) => {

    chartGroup
        .selectAll('node')
        .data( data )
        .enter()
        .append("circle")
          .attr("class","nodes-input-projection")
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
    });

  return (
    <>
      <svg ref={ref}></svg>
    </>
  )
}

export default DataProjection