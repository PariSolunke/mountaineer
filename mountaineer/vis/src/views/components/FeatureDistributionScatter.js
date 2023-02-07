import React from 'react'

//reference to renderD3 hook
import { renderD3 } from '../../hooks/render.hook';

//styles


// d3
import * as d3 from 'd3';


const FeatureDistributionScatter = ({distributionValues, globalMax, globalMin}) => {
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
            top: 5,
            left:25,
            right: 5,
            bottom: 25
        }
        
        //appending group to svgref
        const chartGroup = svgref
            .append("g")
            .attr("transform", `translate(${margins.left},${margins.top})`);

        
        // svg dimensions
        const svgWidthRange = [0, d3.selectAll('.scatter-container').node().getBoundingClientRect().width - margins.left - margins.right];
        const svgHeightRange = [0, d3.selectAll('.scatter-container').node().getBoundingClientRect().height - margins.top - margins.bottom];
        svgref.node().style.width=d3.selectAll('.scatter-container').node().getBoundingClientRect().width;
        svgref.node().style.height=d3.selectAll('.scatter-container').node().getBoundingClientRect().height;

        // X and Y Scales

        const xScale = d3.scaleBand()
          .domain(['global','filter1','filter2'])
          .range(svgWidthRange);
        
        const colorScale=d3.scaleOrdinal()
          .domain([0,1])
          .range(['#2cba00','#db0f0f']);


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
        
        chartGroup.selectAll('scatter-points')
        .data(distributionValues)
        .enter()
        .append("circle")
          .attr("cx", function (d) {return ( (xScale(d.dist)+xScale.bandwidth()/2))+(60*(Math.random()-0.5)) } )
          .attr("cy", function (d) { return yScale(d.featureVal); } )
          .attr("r", 2)
          .style("fill", function(d){return colorScale(d.y)})
});

return (
    <>      
     
      <svg ref={ref}></svg>
  
    </>
  )
}

export default FeatureDistributionScatter