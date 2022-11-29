//react
import React, {useEffect, useState} from 'react';

//reference to renderD3 hook
import { renderD3 } from '../../hooks/render.hook';

//styles
import './styles/DataProjection.css'

// d3
import * as d3 from 'd3';

const DataProjection = ({input_projection, dataRange, birefDataProj, lasso}) => {

  //state to check filtered data
  const [filters,setFilter]=useState({filteredIndices: new Set(), filterStatus: false });

  //Update state when the other component is brushed
  function otherBrushed(selectedIndices,filterStatus){
    let tempObj={filteredIndices:new Set(selectedIndices),filterStatus: filterStatus}
    setFilter(tempObj);
  } 
  
  //Bidirectional reference object to enable two way communication between parent and child component
  birefDataProj.child={
    otherBrushed: otherBrushed
  };

  //selected indices for brushing
  let selectedIndices=new Set();

  //clear plot
  const clear_plot = (svgref) => {
    svgref.selectAll('*').remove();
  }


  //render the scatterplot
  const render_scatterplot = ( chartGroup, xScale, yScale, data ) => {

    chartGroup
        .selectAll('node')
        .data( data )
        .enter()
        .append("circle")
          .attr("class",function(d,i){
            if(filters.filterStatus){
              if(filters.filteredIndices.has(i))
                return "node-input-projection node-input-projection-selected";
              else
                return "node-input-projection node-input-projection-unselected";          
              }
            return "node-input-projection" 
          })
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
            top: 15,
            left:15,
            right: 15,
            bottom: 15
        }
        
        //appending group to svgref
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
        
        //render scatterplot
        render_scatterplot( chartGroup, xScale, yScale, input_projection);
        

        //add brush
        

        let lassoBrush=lasso()
        .items(chartGroup.selectAll('.node-input-projection'))
        .targetArea(svgref)
        .on("draw",lasso_draw)
        .on("end",lasso_end);
        svgref.call(lassoBrush);
        
        //lasso handler functions
        function lasso_draw(){
          lassoBrush.items()
          .attr("class","node-input-projection node-input-projection-unselected");
        }

        function lasso_end(){

          selectedIndices.clear()          
          let nodesSelected=lassoBrush.selectedItems()["_groups"][0];

          if (nodesSelected.length>0){

            lassoBrush.selectedItems().attr("class","node-input-projection node-input-projection-selected");
            lassoBrush.notSelectedItems().attr("class","node-input-projection node-input-projection-unselected");

            let nodes=chartGroup.selectAll('.node-input-projection')["_groups"][0];
            console.log(nodes)

            nodes.forEach((node,i) =>{
              if (node.classList.contains("node-input-projection-selected"))
                selectedIndices.add(i)
            });      
            birefDataProj.parent.onBrush(selectedIndices, "DataProjection", true);

          }
          else{
            lassoBrush.items()
            .attr("class","node-input-projection");
            birefDataProj.parent.onBrush(selectedIndices, "DataProjection", false);
          }

        }


        //handle brushing
        function handleBrush(e) {
          let nodes=chartGroup.selectAll('.node-input-projection');
          nodes.classed("node-input-projection-unselected", false);
          selectedIndices.clear();
          let extent = e.selection;
          nodes.attr("class", function(d,i){ 
                                                    if(extent && isBrushed(extent, xScale(d[0]), yScale(d[1]) )){
                                                      selectedIndices.add(i);
                                                      return "node-input-projection node-input-projection-selected";
                                                    }
                                                    return "node-input-projection node-input-projection-unselected"; } );
          if(extent)
            birefDataProj.parent.onBrush(selectedIndices, "DataProjection", true);
          else
            birefDataProj.parent.onBrush(selectedIndices, "DataProjection", false);    
        }
    });

  return (
    <>
      <svg ref={ref}></svg>
    </>
  )
}

export default DataProjection