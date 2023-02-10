//react
import React, {useEffect, useState} from 'react';

//reference to renderD3 hook
import { renderD3 } from '../../hooks/render.hook';

//styles
import './styles/DistanceMatrix.css'

// d3
import * as d3 from 'd3';

const DistanceMatrix = ({distance_matrix , birefDistMatrix}) => {

    
  //Update state when the other component is brushed
  function otherBrushed(){

  } 
  
  //Bidirectional reference object to enable two way communication between parent and child component
  birefDistMatrix.child={
    otherBrushed: otherBrushed
  };


  //clear plot
  const clear_plot = (svgref) => {
    svgref.selectAll('*').remove();
  }


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


        // svg dimensions
        const svgWidthRange = [0, d3.selectAll('.distance-matrix-container').node().getBoundingClientRect().width - margins.left - margins.right];
        const svgHeightRange = [0, d3.selectAll('.distance-matrix-container').node().getBoundingClientRect().height - margins.top - margins.bottom];
        svgref.node().style.width=d3.selectAll('.distance-matrix-container').node().getBoundingClientRect().width;
        svgref.node().style.height=d3.selectAll('.distance-matrix-container').node().getBoundingClientRect().height;

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
        
        //render heatmap
        render_heatmap( chartGroup, xScale, yScale);
        
    });

  return (
    <>
      <svg ref={ref}></svg>
    </>
  )
}

export default DistanceMatrix