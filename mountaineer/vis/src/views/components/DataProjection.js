//react
import React, {useEffect, useState} from 'react';

//reference to renderD3 hook
import { renderD3 } from '../../hooks/render.hook';

//styles
import './styles/DataProjection.css'

// d3
import * as d3 from 'd3';

//alasql
import * as alasql from 'alasql';

const DataProjection = ({input_projection, birefDataProj, lasso, dataframe, class_labels}) => {
  //state to check filtered data
  const [state,setState]=useState({colorBy: "class" ,selectedProjection: "UMAP", filteredIndices: new Set(), filterStatus: false });

  //selected indices for brushing
  let chartGroup;
  let selectedIndices=new Set();
  


  //Update state when the other component is brushed
  function otherBrushed(indices, source, filterStatus){
    
    if (source == "DistMatrix" && selectedIndices.size>0)
      birefDataProj.parent.onBrush(selectedIndices, "DataProjection", true);
    else if (source == "DistMatrix" && state.filterStatus==true){
      document.getElementById("sqlCondition").value='';
      setState((prevState)=>({...prevState, filteredIndices: new Set(), filterStatus:false}));
    }
    else if (source=='MapperGraph1'){
      document.getElementById("sqlCondition").value='';
      setState((prevState)=>({...prevState, filteredIndices: new Set(indices.flat()), filterStatus:filterStatus}));
    }
    else if (source=="MapperGraph2"){
      document.getElementById("sqlCondition").value='';
      setState((prevState)=>({...prevState, filteredIndices: new Set(indices.flat()), filterStatus:filterStatus}));
    }

  } 
  
  //Bidirectional reference object to enable two way communication between parent and child component
  birefDataProj.child={
    otherBrushed: otherBrushed
  };



  //clear plotDataProjection
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
          //show or hide nodes depending on filters
          .attr("class",function(d,i){
            if(state.filterStatus){
              if(state.filteredIndices.has(i))
                return "node-input-projection";  
              else
                return "node-input-projection node-input-projection-unselected";          
              }
            return "node-input-projection" 
          })
          .attr("fill",(d, i)=>{
            if (state.colorBy=='predictionAccuracy'){
              if ( (dataframe[i]["lens1"]<0.5 && dataframe[i]["y"]>0.5) || (dataframe[i]["lens1"]>=0.5 && dataframe[i]["y"]<0.5)) 
                return "#d7191c"
              else
                return "#2b83ba"
            }
            else if (state.colorBy=='class'){
              if (dataframe[i]["y"]>0.5) 
              return "#d7191c"
            else
              return "#2b83ba"

            }
          })
            
          .attr("cx", function (d) { return xScale(d[0]); } )
          .attr("cy", function (d) { return yScale(d[1]); } )
          .attr("r", 3)

  }

  const ref = renderD3( 
      (svgref) => {

        //clear the plot 
        clear_plot(svgref);

        // margins
        const margins = {
            top: 50,
            left:15,
            right: 15,
            bottom: 15
        }
        
        //appending group to svgref
        chartGroup = svgref
            .append("g")
            .attr("transform", `translate(${margins.left},${margins.top})`);


        // svg dimensions
        const svgWidthRange = [0, d3.selectAll('.projection-svg-container').node().getBoundingClientRect().width - margins.left - margins.right];
        const svgHeightRange = [0, d3.selectAll('.projection-svg-container').node().getBoundingClientRect().height-2 - margins.top - margins.bottom];
        svgref.node().style.width=svgWidthRange[1]+margins.left+margins.right;
        svgref.node().style.height=svgHeightRange[1]+margins.bottom+margins.top-2;


        let selectedProjection, dataRange;
        if (state.selectedProjection=="UMAP")
          selectedProjection = input_projection['UMAP']
        else
          selectedProjection = input_projection['TSNE']
        dataRange=calculate_data_range(selectedProjection);
          
        //finding the data domain and the scale
        const xDomain = [ dataRange[0], dataRange[1] ];
        const yDomain = [ dataRange[2], dataRange[3] ] ;
        const xScale = d3.scaleLinear().domain(xDomain).range(svgWidthRange);
        const yScale = d3.scaleLinear().domain(yDomain).range([svgHeightRange[1], svgHeightRange[0]]);
        
        //render scatterplot
        render_scatterplot( chartGroup, xScale, yScale, selectedProjection);

        let xLocation= 80/100*svgWidthRange[1];

        svgref.append("circle").attr("cx",xLocation).attr("cy",10).attr("r", 6).style("fill", "#2b83ba")
        svgref.append("circle").attr("cx",xLocation).attr("cy",35).attr("r", 6).style("fill", "#d7191c")
        if (state.colorBy=="class"){
          svgref.append("text").attr("x", xLocation+15).attr("y", 10).text(class_labels[0]).style("font-size", "13px").attr("alignment-baseline","middle").style("fill","black")
          svgref.append("text").attr("x", xLocation+15).attr("y", 35).text(class_labels[1]).style("font-size", "13px").attr("alignment-baseline","middle").style("fill","black")
        }
        else{
          svgref.append("text").attr("x", xLocation+15).attr("y", 10).text("Correct Prediciton").style("font-size", "13px").attr("alignment-baseline","middle").style("fill","black")
          svgref.append("text").attr("x", xLocation+15).attr("y", 35).text("Wrong Prediciton").style("font-size", "13px").attr("alignment-baseline","middle").style("fill","black")
        }

        //add brush
        let lassoBrush=lasso()
        .items(chartGroup.selectAll('.node-input-projection'))
        .targetArea(svgref)
        .on("end",lasso_end);
        svgref.call(lassoBrush);

        //on drawing of lasso
        function lasso_end(){
          document.getElementById("sqlCondition").value='';
          selectedIndices.clear()          
          let nodesSelected=lassoBrush.selectedItems()["_groups"][0];

          if (nodesSelected.length>0){
            //set appropriate classses for selected nodes
            lassoBrush.selectedItems().attr("class","node-input-projection node-input-projection-selected");
            lassoBrush.notSelectedItems().attr("class","node-input-projection node-input-projection-unselected");

            let nodes=chartGroup.selectAll('.node-input-projection')["_groups"][0];
            //add nodes to selected indices set and send this to parent
            nodes.forEach((node,i) =>{
              if (node.classList.contains("node-input-projection-selected"))
                selectedIndices.add(i)
            });      
            birefDataProj.parent.onBrush(selectedIndices, "DataProjection", true);

          }
          //case where no nodes are selected - reset filters and inform parent
          else{
            birefDataProj.parent.onBrush(selectedIndices, "DataProjection", false);
            if (state.filterStatus)
              setState((prevState)=>({...prevState, filteredIndices: new Set(), filterStatus:false}))
            else
              lassoBrush.items().attr("class","node-input-projection");
          }
        }
    });

  //calculate the range for the data
  const calculate_data_range = (inputData) => {
    let xmin = inputData[0][0]; 
    let xmax = inputData[0][0];
    let ymin = inputData[0][1]; 
    let ymax = inputData[0][1];
      
    for( let i=1;i<inputData.length;i++){
      xmin=Math.min(xmin,inputData[i][0]);      
      xmax=Math.max(xmax,inputData[i][0]);
      ymin=Math.min(ymin,inputData[i][1]);      
      ymax=Math.max(ymax,inputData[i][1]);   
    }
    return([xmin,xmax,ymin,ymax]);
}

  const changeProjection = (event) =>{
    if(selectedIndices.size>0){
      birefDataProj.parent.onBrush(new Set(), "DataProjection", false);
    } 
    setState((prevState)=>({...prevState, selectedProjection:event.target.value}));
  }

  const changeProjColor = (event) =>{
    if(selectedIndices.size>0){
      birefDataProj.parent.onBrush(new Set(), "DataProjection", false);
    }
    setState((prevState)=>({...prevState, colorBy:event.target.value}));
  }
  
  const handleSQLSubmit = (event) =>{
  
    let result;
    let sqlError=false;
      
    try{
      let textInput= document.getElementById("sqlCondition").value;
      let query = "SELECT * FROM ? WHERE " + textInput;
      result = alasql(query,[dataframe]);
    } 
    catch(error){
        sqlError = true;
        alert("SQL Error - please check syntax or column names");
    }
    if (!sqlError){
      selectedIndices.clear()
      if (result.length>0){
        result.forEach((row)=>{
          selectedIndices.add(row.rowIndex)
        })
        let nodes=chartGroup.selectAll('.node-input-projection')["_groups"][0];
            //add nodes to selected indices set and send this to parent
        nodes.forEach((node,i) =>{
          if(selectedIndices.has(i))
            node.setAttribute('class', 'node-input-projection node-input-projection-selected') 
          else
            node.setAttribute('class', 'node-input-projection node-input-projection-unselected')           
        });
        birefDataProj.parent.onBrush(selectedIndices, "DataProjection", true);      
      }
      else
        alert("No matches for given SQL conditions");
    }  


  } 
  
  return (
    <>
      <div className='projection-options-selection'>
        <div>
          <label htmlFor="projectionSelect">Projection:&nbsp;</label>
          <select value={state.selectedProjection} id="projectionSelect"  onChange={changeProjection}>
            <option value="UMAP">UMAP</option>
            <option value="TSNE">TSNE</option>

          </select>
        </div>
        <div>
          <label htmlFor='projNodeColorBy'>Node Color:&nbsp;</label>
          <select value={state.colorBy} id="projNodeColorBy" onChange={changeProjColor}>
            <option value="class">Class</option>
            <option value="predictionAccuracy">Accuracy</option>
          </select>
        </div>
      </div>
      <div className='projection-svg-container'>
        <svg ref={ref}></svg>
      </div>
      <div className='sql-form'>
          <label for="sqlCondition">
            SELECT * FROM DATA WHERE 
          </label>
          <input id="sqlCondition" type="text" placeholder="Enter SQL Condition/s for custom filtering"/>
          <input type="button" value="Submit" onClick={handleSQLSubmit} />
      </div>
    </>
  )
}

export default DataProjection