//react
import React, {useEffect, useState} from 'react';

//reference to renderD3 hook
import { renderD3 } from '../../hooks/render.hook';

//styles
//import './styles/DistanceMatrix.css'

// d3
import * as d3 from 'd3';
import { max } from 'd3';

const AttributionChart = ({column_names , explanations}) => {

    const  [state, setState]=useState({mapper1:0,mapper2:1,selectedIndices:new Set(), filterStatus:false});
  //Update state when the other component is brushed
  console.log(explanations)
  
  //Bidirectional reference object to enable two way communication between parent and child component
  //birefDistMatrix.child={
    //otherBrushed: otherBrushed
  //};
  let maxVal1, maxVal2
  let summary1={}, summary2={};

  column_names.forEach((column, ci)=>{
    
    summary1[column] = (explanations[state.mapper1].reduce((accumulator, row) => {
      return accumulator + row[ci];
    }, 0))/explanations[state.mapper1].length;
    if (maxVal1==null)
      maxVal1=Math.abs(summary1[column])
    else 
      maxVal1=Math.max(maxVal1, Math.abs(summary1[column]))

    summary2[column] = (explanations[state.mapper2].reduce((accumulator, row) => {
      return accumulator + row[ci];
    }, 0))/explanations[state.mapper2].length;

    if (maxVal2==null)
      maxVal2=Math.abs(summary2[column])
    else 
      maxVal2=Math.max(maxVal2, Math.abs(summary2[column]))

  })
  
  let scaleSummary1=d3.scaleLinear().domain([-maxVal1,maxVal1]).range([-5,5])
  let scaleSummary2=d3.scaleLinear().domain([-maxVal2,maxVal2]).range([-5,5])

let graphData1=[]
for (let [key, value] of Object.entries(summary1)) {
  graphData1.push({feature:key, value: scaleSummary1(value)})
}

let graphData2=[]
for (let [key, value] of Object.entries(summary2)) {
  graphData2.push({feature:key, value: scaleSummary2(value)})
}
  //clear plot
  const clear_plot = (svgref) => {
    svgref.selectAll('*').remove();
  }
  console.log(graphData1)
  console.log(graphData2)
  /*
  //render the distance matrix
  const render_heatmap = ( chartGroup, xScale, yScale ) => {
    let maxDist=0;
    distance_matrix.forEach(subArr => {
        maxDist=Math.max(maxDist,d3.max(subArr))
    });
    let colorScale=d3.scaleLinear()
    .range(['#ffffcc','#b10026'])
    .domain([0,maxDist])

    for(let i=0;i<distance_matrix.length;i++){
        for(let j=0;j<distance_matrix.length;j++){
            
            chartGroup
            .append("rect")
            .attr("x", xScale(i+1))
            .attr("y", yScale(j+1))
            .attr("width", xScale.bandwidth() )
            .attr("height", yScale.bandwidth() )
            .style("fill", function(){if (i==j){ return "black"} else return colorScale(distance_matrix[i][j])})

        }
    }
  }
  */
  const ref = renderD3( 
    (svgref) => {

        //clear the plot 
        clear_plot(svgref);

        // margins
        const margins = {
            top: 60,
            left:20,
            right: 30,
            bottom: 20
        }
        
        //appending group to svgref
        const chartGroup = svgref
            .append("g")
            .attr("transform", `translate(${margins.left},${margins.top})`);


        // svg dimensions
        const svgWidthRange = [0, d3.select('.attributions-container').node().getBoundingClientRect().width - margins.left - margins.right];
        svgref.node().style.width=d3.select('.attributions-container').node().getBoundingClientRect().width;
        const svgHeightRange = [0, 85*column_names.length];
        svgref.node().style.height=svgHeightRange[1]+margins.top+margins.bottom;


        const xScale = d3.scaleLinear().domain([-5,5]).range(svgWidthRange);
        chartGroup.append("g")
            .attr("class","chart-axes")
            .call(d3.axisTop(xScale));

        const yScale = d3.scaleBand().domain(column_names).range(svgHeightRange);

        chartGroup
          .append('g')
          .selectAll('text')
          .data(graphData1)
          .join('text')
          .attr('x', xScale(0))
          .attr('y', (d) => 15 + yScale(d.feature))
          .text((d)=>d.feature)
          .attr("text-anchor", "middle")
          //.style("alignment-baseline", "middle")
          .style("fill", "black");

        chartGroup
          .append('g')
          .selectAll('rect')
          .data(graphData1)
          .join('rect')
          .attr('x', (d) => Math.min(xScale(d.value), xScale(0)))
          .attr('y', (d, i) => 23+yScale(d.feature))
          .attr('height', 18)
          .attr('width', (d) => xScale(Math.abs(d.value))-xScale(0))
          .attr('fill', ('#7fc97f'));
          
          chartGroup
          .append('g')
          .selectAll('rect')
          .data(graphData2)
          .join('rect')
          .attr('x', (d) => Math.min(xScale(d.value), xScale(0)))
          .attr('y', (d) => 41 + yScale(d.feature))
          .attr('height', 18)
          .attr('width', (d) => xScale(Math.abs(d.value))-xScale(0))
          .attr('fill', '#fdc086');

          chartGroup
            .append('g')
            .selectAll('line')
            .data(graphData1)
            .join('line')
          

        
    });

  return (
    <>
      <div>Mean Feature Importance</div>
      <svg ref={ref}></svg>
    </>
  )
}

export default AttributionChart