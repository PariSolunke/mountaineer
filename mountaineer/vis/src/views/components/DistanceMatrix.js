//react
import React, {useEffect, useState} from 'react';

//reference to renderD3 hook
import { renderD3 } from '../../hooks/render.hook';

//styles
import './styles/DistanceMatrix.css'

// d3
import * as d3 from 'd3';

const DistanceMatrix = ({distance_matrix , birefDistMatrix, labels}) => {

  const [state,setState]=useState({selected1:0,selected2:1})
  //Update state when the other component is brushed
  function otherBrushed(newMapper, source){
  
    if (source=="MapperGraph1")
      setState((prevState)=>({...prevState, selected1:newMapper}))
    else if (source=="MapperGraph2")
      setState((prevState)=>({...prevState, selected2:newMapper}))
  
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
  const render_heatmap = ( chartGroup, xScale, yScale, domain ) => {
    let maxDist=0;
    distance_matrix.forEach(subArr => {
        maxDist=Math.max(maxDist,d3.max(subArr))
    });
    let colorScale=d3.scaleLinear()
    .range(['#ffffcc','#b10026'])
    .domain([0,maxDist])

    for(let i=0;i<distance_matrix.length;i++){
      for(let j=i;j<distance_matrix.length;j++){
        chartGroup.append("rect")
          .attr("x", xScale(domain[i]))
          .attr("y", yScale(domain[j]))
          .attr("data-i",i)
          .attr("data-j",j)
          .attr("width", xScale.bandwidth())
          .attr("height", yScale.bandwidth() )
          .style("fill", ()=>{
            if (i==j)
              return "#98eb98"
            else
              return colorScale(distance_matrix[i][j])})
          .classed("curSelection", ()=>{
            if ((i==state.selected1 && j==state.selected2) || (j==state.selected1 && i==state.selected2) )
              return true
            return false 
          })
          .on("click", (d)=>{
            let newI=parseInt(d.target.dataset["i"]);
            let newJ=parseInt(d.target.dataset["j"])
            if (!((state.selected1==newI && state.selected2==newJ) ||(state.selected2==newI && state.selected1==newJ))){
              birefDistMatrix.parent.onMapperSelect(newI, newJ)
              setState((prevState)=>({...prevState, selected1:newI, selected2:newJ}))
            }
          })
      }
    }
  }

  const ref = renderD3( 
    (svgref) => {
      //clear the plot 
      clear_plot(svgref);

      // margins
      let margins;
      if (labels.length>0)
        margins = { top: 5, left:60, right:  5, bottom: 50 }
      else
        margins = { top: 10, left:20, right:  10, bottom: 20 }

      //appending group to svgref
      const chartGroup = svgref
          .append("g")
          .attr("transform", `translate(${margins.left},${margins.top})`);

      // svg dimensions
      const svgWidthRange = [0, d3.selectAll('.distance-matrix-container').node().getBoundingClientRect().width - margins.left - margins.right];
      const svgHeightRange = [0, d3.selectAll('.distance-matrix-container').node().getBoundingClientRect().height-2 - margins.top - margins.bottom];
      svgref.node().style.width=d3.selectAll('.distance-matrix-container').node().getBoundingClientRect().width;
      svgref.node().style.height=d3.selectAll('.distance-matrix-container').node().getBoundingClientRect().height-2;

      //finding the data domain and the scale
      let domain;
      if (labels.length>0)
        domain = labels
      else
        domain = Array.from({length: distance_matrix.length}, (_, i) => i + 1);

      let matrixSize = d3.min([svgHeightRange[1], svgWidthRange[1], 40 * distance_matrix.length]);
  
      const xScale = d3.scaleBand().domain(domain).range([0,matrixSize]).padding(0.01);
      const yScale = d3.scaleBand().domain(domain).range([svgHeightRange[1]-matrixSize,svgHeightRange[1]]).padding(0.01);
        

      if (labels.length==0){
        chartGroup.append("g")
            .attr("class","chart-axes")
            .attr("transform", `translate(0, ${svgHeightRange[1]})`)
            .call(d3.axisBottom(xScale));

        chartGroup.append("g")
            .attr("class","chart-axes")
          .call(d3.axisLeft(yScale));
      }

      else{
        chartGroup.append("g")
        .attr("class","chart-axes")
        .attr("transform", `translate(0, ${svgHeightRange[1]})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")  
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

        chartGroup.append("g")
          .attr("class","chart-axes")
          .call(d3.axisLeft(yScale))
          .selectAll("text")  
          .attr("transform", "rotate(-30)");

      }
      
      //render heatmap
      render_heatmap( chartGroup, xScale, yScale, domain);
      
    });

  return (
    <>
      <svg ref={ref}></svg>
    </>
  )
}

export default DistanceMatrix