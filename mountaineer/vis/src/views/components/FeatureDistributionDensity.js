import React from 'react'
import { renderD3 } from '../../hooks/render.hook';
import * as d3 from 'd3';
import  './styles/FeatureDistributionDensity.css'


const FeatureDistributionDensity = ({distributionValues, filterStatus, columns}) => {
  
  console.log(distributionValues)
  
  
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
        top: 0,
        left:15,
        right: 15,
        bottom: 35
    }

    let containerWidth = d3.selectAll('.density-container').node().getBoundingClientRect().width;
    let containerHeight = d3.selectAll('.density-container').node().getBoundingClientRect().height;
    svgref.node().style.width=d3.selectAll('.density-container').node().getBoundingClientRect().width;
    if (columns.length % 2 == 0)
      svgref.node().style.height=containerHeight/2 * columns.length/2 + 30;
    else
      svgref.node().style.height=containerHeight/2 * (columns.length+1)/2 + 30;



    /*
    //appending group to svgref
    

  
    */

    

    let densities = []

    let xScales = {}
    let yScales = {}
    // Compute kernel density estimation
    columns.forEach((column) => {
    
    let globalMax =  distributionValues[column].globalMax
    let globalMin =  distributionValues[column].globalMin
    
    let xScale = d3.scaleLinear()
      .domain([globalMin-0.1*(globalMax-globalMin), globalMax+0.1*(globalMax-globalMin)])
      .range([margins.left,containerWidth/2-margins.right]);

    let kdeBandwidth= (globalMax-globalMin) * 0.05
    let kde = kernelDensityEstimator(kernelEpanechnikov(kdeBandwidth), xScale.ticks(60))

    let density1 =  kde( distributionValues[column].distribution
      .filter( function(d){return d.dist == "global"} )
      .map(function(d){  return d.featureVal; }))
    
    let density2

    if(filterStatus){
     density2 =  kde( distributionValues[column].distribution
      .filter( function(d){return d.dist == "filter1"} )
      .map(function(d){  return d.featureVal; }) )
    }
    

    let yMax=0;
    let densityDiff=0
    for (let i=0; i< density1.length; i++){
      if (!filterStatus)
        yMax=Math.max(density1[i][1], yMax);
      else{
        densityDiff += Math.abs(density1[i][1] + density2[i][1] )
        yMax=d3.max([density1[i][1], density2[i][1] ,yMax]);
      }
    }
    
    

    let yScale = d3.scaleLinear()
      .domain([0, yMax*1.2])
      .range([containerHeight/2-margins.bottom, margins.top]);

    densities.push({feature:column, density1:density1, density2:density2, densityDiff:densityDiff})  
    xScales[column]=xScale
    yScales[column]=yScale
    })
    console.log(densities)
    console.log(xScales)
    console.log(yScales)
    if(filterStatus)
      densities.sort((a,b)=> b.densityDiff-a.densityDiff)
    densities.forEach((element, index)=>{

      let xCoord,yCoord;
      if (index%2==0){;
        xCoord = 0;
        yCoord = index/2 * containerHeight/2;
      }
      else{
        xCoord = containerWidth/2;
        yCoord = (index-1)/2 * containerHeight/2;
      }
      let chartGroup = svgref
        .append("g")
        .attr("transform", `translate(${xCoord},${15 + yCoord})`);

      chartGroup.append("path")
        .datum(element.density1)
        .attr("fill", "#69b3a2")
        .attr("opacity", ".6")
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .attr("stroke-linejoin", "round")
        .attr("d",  d3.line()
          .curve(d3.curveBasis)
            .x(function(d) { return xScales[element.feature](d[0]); })
            .y(function(d) { return yScales[element.feature](d[1]); })
        );
      
      if(filterStatus){
        chartGroup.append("path")
          .datum(element.density2)
          .attr("fill", "#404080")
          .attr("opacity", ".6")
          .attr("stroke", "#000")
          .attr("stroke-width", 1)
          .attr("stroke-linejoin", "round")
          .attr("d",  d3.line()
            .curve(d3.curveBasis)
              .x(function(d) { return xScales[element.feature](d[0]); })
              .y(function(d) { return yScales[element.feature](d[1]); })
          );
      }

      chartGroup.append("g")
        .attr("class","chart-axes")
        .attr("transform", `translate(0, ${yScales[element.feature].range()[0]})`)
        .call(d3.axisBottom(xScales[element.feature]).tickSizeOuter(0));

      chartGroup.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("font-size", "13px")
        .attr("x", containerWidth/4)
        .attr("y", yScales[element.feature].range()[0] + margins.bottom)
        .text(element.feature);

    })


    svgref.append("circle").attr("cx",containerWidth * 0.15).attr("cy",15).attr("r", 6).style("fill", "#69b3a2")
    svgref.append("text").attr("x", containerWidth * 0.15 + 16).attr("y", 20).text("Global Prob. Density").style("font-size", "13px").attr("text-anchor","start").style("fill","black")

    if(filterStatus){
      svgref.append("circle").attr("cx",containerWidth * 0.65).attr("cy",15).attr("r", 6).style("fill", "#404080")
      svgref.append("text").attr("x", containerWidth * 0.65 + 16).attr("y", 20).text("Filtered Prob. Density").style("font-size", "13px").attr("text-anchor","start").style("fill","black")
    }
      
  });
  
  return (
    <>      
      <svg ref={ref}></svg>
    </>
  )
}

export default FeatureDistributionDensity