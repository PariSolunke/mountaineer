import React from 'react'
import { renderD3 } from '../../hooks/render.hook';
import * as d3 from 'd3';
import  './styles/FeatureDistributionViolin.css'


const FeatureDistributionViolin = ({distributionValues, globalMax, globalMin, birefViolin}) => {

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
            left:25,
            right: 10,
            bottom: 25
        }
        
        //appending group to svgref
        const chartGroup = svgref
            .append("g")
            .attr("transform", `translate(${margins.left},${margins.top})`);

        
        // svg dimensions
        const svgWidthRange = [0, d3.selectAll('.violin-container').node().getBoundingClientRect().width - margins.left - margins.right];
        const svgHeightRange = [0, d3.selectAll('.violin-container').node().getBoundingClientRect().height - margins.top - margins.bottom];
        svgref.node().style.width=d3.selectAll('.violin-container').node().getBoundingClientRect().width;
        svgref.node().style.height=d3.selectAll('.violin-container').node().getBoundingClientRect().height;

        // X and Y Scales

        const xScale = d3.scaleBand()
          .domain(['global','filter1','filter2'])
          .range(svgWidthRange);
        
        const colorScale=d3.scaleOrdinal()
          .domain(['global','filter1','filter2'])
          .range(['#beaed4','#7fc97f','#fdc086']);


        chartGroup.append("g")
            .attr("class","chart-axes")
            .attr("transform", `translate(0, ${svgHeightRange[1]})`)
            .call(d3.axisBottom(xScale));
        
        const yScale = d3.scaleLinear()
          .domain([globalMin-(0.1*(globalMax-globalMin)),globalMax+(0.1*(globalMax-globalMin))])
          .range([svgHeightRange[1], svgHeightRange[0]]);

        chartGroup.append("g")
            .attr("class","chart-axes")
          .call(d3.axisLeft(yScale));


        let histogram = d3.bin()
          .value(d => d)
          .domain(yScale.domain())
          .thresholds(yScale.ticks(20))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
          
  
    // Compute the binning for each group of the dataset
      let sumstat= d3.rollup(distributionValues, 
        function(v) {   // For each key..
          let input = v.map(function(g) { return g.featureVal;})    // Keep the variable of choice
          let bins = histogram(input)   // And compute the binning on it.
          return(bins)
          } ,
        d => d.dist);
      
  
    // What is the biggest number of value in a bin? We need it cause this value will have a width of 100% of the bandwidth.
    let maxNum = 0


    for (let value of  sumstat.values()) {
      let lengths = value.map(function(a){return a.length;})
      maxNum= Math.max(maxNum,d3.max(lengths))
    }

    // The maximum width of a violin must be x.bandwidth = the width dedicated to a group
    let xNum = d3.scaleLinear()
      .range([5, xScale.bandwidth()-5])
      .domain([-maxNum,maxNum])
    
    chartGroup
      .selectAll("myViolin")
      .data(sumstat)
      .enter()        // So now we are working group per group
      .append("g")
        .attr("transform", function(d){ //console.log(d) 
          return("translate(" + xScale(d[0]) +" ,0)") } )
         // Translation on the right to be at the group position
        .append("path")
          .attr('id',function(d){
            return (d[0]+"-violin")
          })
          .on('click', function(e){
            birefViolin.parent.onBrush(e.target.id);
          })
          .style("stroke", "none")
          .style("fill",function(d){return colorScale(d[0]) })
          .datum(function(d){  return(d[1])})     // So now we are working bin per bin
          
          .attr("d", d3.area()
            .x0(function(d){ //console.log(xNum(-d.length))
                            return(xNum(-d.length)) } )
            .x1(function(d){ //console.log(xNum(d.length))
              return(xNum(d.length)) } )
            .y(function(d){ //console.log(yScale(d.x0))
              return(yScale(d.x0)) } )
            .curve(d3.curveCatmullRom)    // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference
        )

        
        
    });

  return (
    <>      
     
      <svg ref={ref}></svg>
  
    </>
  )
}

export default FeatureDistributionViolin