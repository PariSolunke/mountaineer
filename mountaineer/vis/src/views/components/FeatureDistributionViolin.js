import React from 'react'
import { renderD3 } from '../../hooks/render.hook';
import * as d3 from 'd3';

const FeatureDistributionViolin = () => {

//clear plot
  const clear_plot = (svgref) => {
    svgref.selectAll('*').remove();
  }

  const ref = renderD3( 
    (svgref) => {

        //clear the plot 
        clear_plot(svgref);

        // margins
        const margins = {
            top: 10,
            left:20,
            right: 10,
            bottom: 20
        }
        
        //appending group to svgref
        const chartGroup = svgref
            .append("g")
            .attr("transform", `translate(${margins.left},${margins.top})`);

        /*
        // svg dimensions
        //const svgWidthRange = [0, d3.selectAll('.distance-matrix-container').node().getBoundingClientRect().width - margins.left - margins.right];
        //const svgHeightRange = [0, d3.selectAll('.distance-matrix-container').node().getBoundingClientRect().height - margins.top - margins.bottom];
        //svgref.node().style.width=d3.selectAll('.distance-matrix-container').node().getBoundingClientRect().width;
        //svgref.node().style.height=d3.selectAll('.distance-matrix-container').node().getBoundingClientRect().height;

        //finding the data domain and the scale

        const domain = Array.from({length: distance_matrix.length}, (_, i) => i + 1);

        const xScale = d3.scaleBand().domain(domain).range(svgWidthRange).padding(0.01);
        chartGroup.append("g")
            .attr("class","chart-axes")
            .attr("transform", `translate(0, ${svgHeightRange[1]})`)
            .call(d3.axisBottom(xScale));

        const yScale = d3.scaleBand().domain(domain).range([svgHeightRange[1], svgHeightRange[0]]).padding(0.01);
        chartGroup.append("g")
            .attr("class","chart-axes")
          .call(d3.axisLeft(yScale));
          */
        
        
    });

  return (
    <>FeatureDistribution</>
  )
}

export default FeatureDistributionViolin