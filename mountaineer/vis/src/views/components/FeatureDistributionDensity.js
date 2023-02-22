import React from 'react'
import { renderD3 } from '../../hooks/render.hook';
import * as d3 from 'd3';
import  './styles/FeatureDistributionDensity.css'


const FeatureDistributionDensity = ({distributionValues, globalMax, globalMin}) => {

  //clear plot
  const clear_plot = (svgref) => {
    svgref.selectAll('*').remove();
  }

  // Function to compute density
  const kernelDensityEstimator = (kernel, X) => {
    return function(V) {
      return X.map(function(x) {
        return [x, d3.mean(V, function(v) { return kernel(x - v); })];
      });
    };
  }
  const kernelEpanechnikov = (k)=> {
    return function(v) {
      return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
  }

  const ref = renderD3((svgref) => {

    //clear the plot 
    clear_plot(svgref);

    // margins
    const margins = {
        top: 10,
        left:35,
        right: 10,
        bottom: 25
    }
    
    //appending group to svgref
    const chartGroup = svgref
        .append("g")
        .attr("transform", `translate(${margins.left},${margins.top})`);

    
    // svg dimensions
    const svgWidthRange = [0, d3.selectAll('.violin-container').node().getBoundingClientRect().width - margins.left - margins.right];
    const svgHeightRange = [0, d3.selectAll('.violin-container').node().getBoundingClientRect().height -2 - margins.top - margins.bottom];
    svgref.node().style.width=d3.selectAll('.violin-container').node().getBoundingClientRect().width;
    svgref.node().style.height=d3.selectAll('.violin-container').node().getBoundingClientRect().height-2;

    // X and Y Scales

    const xScale = d3.scaleLinear()
      .domain([globalMin-0.1*(globalMax-globalMin), globalMax+0.1*(globalMax-globalMin)])
      .range(svgWidthRange);

    chartGroup.append("g")
      .attr("class","chart-axes")
      .attr("transform", `translate(0, ${svgHeightRange[1]})`)
      .call(d3.axisBottom(xScale));
  
    const yScale = d3.scaleLinear()
      .domain([0, 0.2])
      .range([svgHeightRange[1], svgHeightRange[0]]);

    chartGroup.append("g")
      .attr("class","chart-axes")
      .call(d3.axisLeft(yScale));

    // Compute kernel density estimation
    let kdeBandwidth= (globalMax-globalMin) * 0.05
    const kde = kernelDensityEstimator(kernelEpanechnikov(kdeBandwidth), xScale.ticks(60))

    const density1 =  kde( distributionValues
      .filter( function(d){return d.dist == "global"} )
      .map(function(d){  return d.featureVal; }) )
    const density2 =  kde( distributionValues
      .filter( function(d){return d.dist == "filter1"} )
      .map(function(d){  return d.featureVal; }) )
  
  console.log(density2)
  // Plot the area
  chartGroup.append("path")
  .datum(density1)
  .attr("fill", "#69b3a2")
  .attr("opacity", ".6")
  .attr("stroke", "#000")
  .attr("stroke-width", 1)
  .attr("stroke-linejoin", "round")
  .attr("d",  d3.line()
    .curve(d3.curveBasis)
      .x(function(d) { console.log(d)
        return xScale(d[0]); })
      .y(function(d) { return yScale(d[1]); })
  );
  
  // Plot the area
  chartGroup.append("path")
    .datum(density2)
    .attr("fill", "#404080")
    .attr("opacity", ".6")
    .attr("stroke", "#000")
    .attr("stroke-width", 1)
    .attr("stroke-linejoin", "round")
    .attr("d",  d3.line()
      .curve(d3.curveBasis)
        .x(function(d) { return xScale(d[0]); })
        .y(function(d) { return yScale(d[1]); })
    );

    
        
  });

  return (
    <>      
     
      <svg ref={ref}></svg>
  
    </>
  )
}

export default FeatureDistributionDensity