import React,{useState} from 'react'

//reference to renderD3 hook
import { renderD3 } from '../../hooks/render.hook';

//styles


// d3
import * as d3 from 'd3';


const FeatureDistributionScatter = ({distributionValues, globalMax, globalMin, birefScatter}) => {

  const [selectedDistribution,setDistribution]=useState("global");

  //clear plot
  const clear_plot = (svgref) => {
      svgref.selectAll('*').remove();
    }

  //Update state when the other component is brushed
  function otherBrushed(clickedId){
    if (clickedId=='global-violin')
      setDistribution("global")
    else if (clickedId=="filter1-violin")
      setDistribution("filter1")
    else
      setDistribution("filter2")
      
  } 
  
  //Bidirectional reference object to enable two way communication between parent and child component
  birefScatter.child={
    otherBrushed: otherBrushed
  };

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
        const svgWidthRange = [0, d3.selectAll('.scatter-container').node().getBoundingClientRect().width - margins.left - margins.right];
        const svgHeightRange = [0, d3.selectAll('.scatter-container').node().getBoundingClientRect().height - margins.top - margins.bottom];
        svgref.node().style.width=d3.selectAll('.scatter-container').node().getBoundingClientRect().width;
        svgref.node().style.height=d3.selectAll('.scatter-container').node().getBoundingClientRect().height;

        // X and Y Scales

        const xScale = d3.scaleLinear()
          .domain([0,1])
          .range(svgWidthRange);
        
        const colorScale=d3.scaleOrdinal()
          .domain([0,1])
          .range(['#fed976','#b10026']);


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
        
        let displayData=[]

        displayData=distributionValues.filter((e)=>{return (e.dist==selectedDistribution);})

        chartGroup.selectAll('scatter-points')
        .data(displayData)
        .enter()
        .append("circle")
          .attr("cx", function (d) {return xScale(d.lens1) } )
          .attr("cy", function (d) { return yScale(d.featureVal); } )
          .attr("r", 3)
          .style("fill", function(d){return colorScale(d.y)})
});

return (
    <>      
     
      <svg ref={ref}></svg>
  
    </>
  )
}

export default FeatureDistributionScatter