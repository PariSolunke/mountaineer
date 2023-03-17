//react and react hooks
import React,{useState} from 'react';
import { renderD3 } from '../../hooks/render.hook';


//styles
import './styles/MapperGraph.css'

// d3
import * as d3 from 'd3';




const MapperGraph = ({mapper_outputs, overlaps, birefMapperGraph, dataframe, columns, lensCount, lasso, minElements, maxElements, mapperId, expl_labels}) => {

  //state to check filtered data
  const [state,setState]=useState({selectedMapper:mapperId-1, nodeColorBy:"lens1", nodeColorAgg:"mean"});
  let chartGroup, colorScale, yScaleLegend, globalRef;
  let nodeColorVals={}
  let nodeColorBy=state.nodeColorBy;
  let nodeColorAgg=state.nodeColorAgg;
  let mapper_output=mapper_outputs[state.selectedMapper];
  let overlap=overlaps[state.selectedMapper];
  let nodeNames=Object.keys(mapper_output.nodes);
  let graphData={nodes:[], links:[]};
  const margins = {
    top: 15,
    left:15,
    right: 25,
    bottom: 15
  }
  let svgHeightRange,svgWidthRange; 

  //Update nodes and links when the other component is brushed
  function otherBrushed(selectedIndices, source, status){
    let links=chartGroup.selectAll('.link-mapper-graph');
    let nodes=chartGroup.selectAll('.node-mapper-graph')
    //if status is false, reset the view to default
    if(source=="DistMatrix" || status==false){
      if (source=="DistMatrix")
        setState((prevState)=>({...prevState, selectedMapper:parseInt(selectedIndices), nodeColorBy:nodeColorBy, nodeColorAgg:nodeColorAgg}));

      links.attr("class","link-mapper-graph link-mapper-graph-default");
      nodes.attr("class","node-mapper-graph");
      changeNodeColor("resetFilter");
      document.getElementById("mapper-selection-container"+mapperId).style.display = "block";
      document.getElementById("densityDisclaimer"+mapperId).style.display = "none";
      document.getElementById("mapper-selection-container"+mapperId).style.cssText = `
        height: 25px;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        justify-content: center;
        align-content: center;`;
      globalRef.select(".axis-legend").remove();
      globalRef.append("g")
        .attr("class","axis-legend")
        .attr("transform", `translate(${svgWidthRange[1]+ 11},0 )`)
        .call(d3.axisRight(yScaleLegend).ticks(10))
        .call(g => g.select(".domain").remove());
    }
    
    else 
    {
      links.attr("class","link-mapper-graph link-mapper-graph-default");
      let filteredIndices= new Set();
      if (source=="DataProjection")
        selectedIndices.forEach(item => filteredIndices.add(item))
      else{
        for (let subArray of selectedIndices){
          subArray.forEach(item => filteredIndices.add(item))
        }
      }
      let densityScale = d3.scaleLinear().domain([0, 1]).range(["#fffcc5", "#8f0026"]);
      nodes.attr("class","node-mapper-graph")      
        .attr("fill",function(d){        
          let currentNodeElements=new Set(d.indices)
          let intersection = new Set([...filteredIndices].filter(x => currentNodeElements.has(x)));
          return densityScale(intersection.size/filteredIndices.size);
      })

      document.getElementById("mapper-selection-container"+mapperId).style.display = "none";
      document.getElementById("densityDisclaimer"+mapperId).style.display = "block";

      let densityScaleLegend = d3.scaleLinear()
        .range([svgHeightRange[1]+margins.top, margins.top])
        .domain([0, 1]);
        
      globalRef.select(".axis-legend").remove();

      globalRef.append("g")
        .attr("class","axis-legend")
        .attr("transform", `translate(${svgWidthRange[1]+ 11},0 )`)
        .call(d3.axisRight(densityScaleLegend).ticks(10))
        .call(g => g.select(".domain").remove());

    }
  } 

  //Bidirectional reference object to enable two way communication between parent and child component
  birefMapperGraph.child={
      otherBrushed: otherBrushed
  };

  //clear plot
  const clear_plot = (svgref) => {
    svgref.selectAll('*').remove();
  }  
  //render the mapper output plot

  const render_graph = (radiusScale, distanceScale) => {
    //creating copies of the data 
    let nodes = JSON.parse(JSON.stringify(graphData.nodes));
    let links = JSON.parse(JSON.stringify(graphData.links));
    
    
    //force layout graph
    
    let simulation =d3.forceSimulation(nodes)
      .on('tick',onTick)
      .force("link", d3.forceLink()                              
        .id(function(d) { return d.id; })                     
        .links(links)
      .distance(function(d){
          return (distanceScale(d.linkOverlap));  
          })
        .iterations(1)
        ) 
        //.force("x", d3.forceX(function(d){return xScale(d.xAvg)}))
        //.force("y", d3.forceY(function(d){return yScale(d.yAvg)}))
        .force("center", d3.forceCenter(svgWidthRange[1]/2,svgHeightRange[1]/2).strength(1.1) )
        .force("collide", d3.forceCollide().strength(0.8).radius(21).iterations(1));
      
    //links
    let link=chartGroup
      .selectAll(".link-mapper-graph")
      .data(links)
      .enter()
      .append("line")
      .attr("class", "link-mapper-graph link-mapper-graph-default"); 

    //nodes in graph
    let n=chartGroup
      .selectAll('node')
      .data(nodes)
      .enter()
      .append("circle")
      .attr("fill",function(d){
        return colorScale(d.colorVal);
      })
      .attr("stroke","black")
     // .attr("cx", function(d){return xScale(d.xAvg)})
       // .attr("cy",function(d){return yScale(d.yAvg)})
      //check if nodes are to be shown or hidden
      .attr("class", "node-mapper-graph")
      //size of nodes based on number of elements
      .attr("r", d=>{return radiusScale(d.numElements);})
      
    function onTick() {
      //update the node positions
      
      n.attr('cx', function(d) { 
        let curRadius= radiusScale(d.numElements);
        return d.x = Math.max(curRadius, Math.min(svgWidthRange[1] - curRadius, d.x)); 
      })
        .attr('cy', function(d) {         
          let curRadius= radiusScale(d.numElements);
          return d.y = Math.max(curRadius, Math.min(svgHeightRange[1] - curRadius, d.y)); 
      })
      
      //update link positions
      link.attr('x1', function(d) { return d.source.x; })
          .attr('y1', function(d) { return d.source.y; })
          .attr('x2', function(d) { return d.target.x; })
          .attr('y2', function(d) { return d.target.y; });
    }

  }

  const ref = renderD3( 
    (svgref) => {
        globalRef=svgref;
        //clear the plot 
        clear_plot(svgref);

        //appending group to svgref
        chartGroup = svgref
            .append("g")
            .attr("transform", `translate(${margins.left},${margins.top})`);

        // svg dimensions 
        svgWidthRange = [0, d3.selectAll('.svg-container').node().getBoundingClientRect().width - margins.left - margins.right];
        svgHeightRange = [0, d3.selectAll('.svg-container').node().getBoundingClientRect().height -2 - margins.top - margins.bottom];
        svgref.node().style.width=d3.selectAll('.svg-container').node().getBoundingClientRect().width;
        svgref.node().style.height=d3.selectAll('.svg-container').node().getBoundingClientRect().height-2;



        //To be used to determine scale for the node radius- minimum and max number of elements in a node in the graph

        let colorMin,colorMax;
        let overlapExtent=[];

        //iterate through every node in the graph
        for(let i=0; i<nodeNames.length;i++){
          let nodeName=nodeNames[i];

          let numElements=mapper_output.nodes[nodeName].length;
          let colorVal=0;
          //find the colorValue for each node based on selected aggregation
          colorVal= findColorVal(mapper_output.nodes[nodeName], numElements);     

          //update the node data
          graphData.nodes.push({id:nodeName, colorVal:colorVal, numElements:numElements, indices:mapper_output.nodes[nodeName] })
          if (nodeName in mapper_output.links){
            
            for (let target of mapper_output.links[nodeName]){
              //update the link data
              let curOverlap=overlap[nodeName][target]
              graphData.links.push( {source:nodeName, target:target, linkOverlap: curOverlap});
              if(overlapExtent.length==0){
                overlapExtent=[curOverlap,curOverlap]
              }
              else{
                overlapExtent[0]=Math.min(overlapExtent[0],curOverlap);
                overlapExtent[1]=Math.max(overlapExtent[1],curOverlap);
              }
            }
          }
        }

        [colorMin,colorMax]= d3.extent(dataframe, d=>d[nodeColorBy])

        //scales for color, and radii of the nodes
        const radiusScale = d3.scaleLinear().domain([minElements,maxElements]).range([6,21]);

        if (nodeColorAgg=='min')
          colorScale=d3.scaleLinear().domain([colorMax, colorMin]).range(["#fffcc5", "#8f0026"]);
        else
          colorScale=d3.scaleLinear().domain([colorMin, colorMax]).range(["#fffcc5", "#8f0026"]);

        const distanceScale=d3.scaleLinear().domain(overlapExtent).range([30,5]);
      
        //render the graph
        render_graph(radiusScale, distanceScale);

        //colorLegend
        let defs = svgref.append("defs");

        let linearGradient = defs.append("linearGradient")
          .attr("id", "linear-gradient-mapper"+mapperId);
    
        linearGradient
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "0%")
          .attr("y2", "100%");
    
        linearGradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", "#8f0026");
    
        linearGradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", "#fffcc5"); 
    
        //Draw the rectangle and fill with gradient
        svgref.append("rect")
          .attr("x",svgWidthRange[1]+1)
          .attr("y",margins.top)
          .attr("width", 10)
          .attr("height", svgHeightRange[1])
          .style("fill", `url(#linear-gradient-mapper${mapperId})`)

    
        
        yScaleLegend = d3.scaleLinear()
          .range([svgHeightRange[1]+margins.top, margins.top])
          .domain([colorMin, colorMax]);
    
        svgref.append("g")
          .attr("class","axis-legend")
          .attr("transform", `translate(${svgWidthRange[1]+ 11},0 )`)
          .call(d3.axisRight(yScaleLegend).ticks(10))
          .call(g => g.select(".domain").remove());

        //add brush
        let lassoBrush=lasso()
        .items(chartGroup.selectAll('.node-mapper-graph'))
        .targetArea(svgref)
        .on("draw",lasso_draw)
        .on("end",lasso_end);
        svgref.call(lassoBrush);
        
        //lasso handlers
        //While lasso is being drawn
        function lasso_draw(){
          
          svgref.selectAll('.lasso').classed("MapperLasso"+mapperId,true)
          lassoBrush.items()
          .attr("class","node-mapper-graph node-mapper-graph-unselected");
        }

        //after lasso is drawn
        function lasso_end(){

          otherBrushed(selectedIndices, "MapperGraph"+mapperId, false);

          let selectedIndices= []
          
          //reset class of nodes and links
          lassoBrush.items().attr("class","node-mapper-graph");
          let links=chartGroup.selectAll('.link-mapper-graph');
          links.attr("class","link-mapper-graph link-mapper-graph-default");
          
          let nodesSelected=lassoBrush.selectedItems()["_groups"][0];

          if (nodesSelected.length>0){
            let selectedIds=new Set();
            lassoBrush.notSelectedItems().attr("class","node-mapper-graph node-mapper-graph-unselected");
            nodesSelected.forEach((node) =>{
              selectedIndices.push(node.__data__.indices);
              /*
              for(let i=0;i<node.__data__.indices.length;i++){
                selectedIndices.push(node.__data__.indices[i]);
              }*/
              selectedIds.add(node.__data__.id)
            });       
            //show only links with source/destination among selected nodes
            links.attr("class",function(d){
              if (selectedIds.has(d.source.id) || selectedIds.has(d.target.id))
                return "link-mapper-graph link-mapper-graph-default"
              else
                return "link-mapper-graph link-mapper-graph-hide"
            });
            //send selected indices to parent
            birefMapperGraph.parent.onBrush(selectedIndices, "MapperGraph"+mapperId, true);
          }

          //case where no node is selected, disables filters
          else
            birefMapperGraph.parent.onBrush(selectedIndices, "MapperGraph"+mapperId, false);
          
        }
    });


    //function to find the colorValue for node based on user selection
    function findColorVal(curIndices, numElements){
      //mean
      if (nodeColorAgg=='mean'){
        let returnValue=0;
        curIndices.forEach(j => {
            returnValue+=dataframe[j][nodeColorBy];
        });
        returnValue=returnValue/numElements;
        return returnValue;
      }

      //max
      else if (nodeColorAgg=='max'){
        let returnValue;
        curIndices.forEach(j => {
          if (returnValue==null)
            returnValue=dataframe[j][nodeColorBy];
          else
            returnValue=Math.max(returnValue, dataframe[j][nodeColorBy]);
        });
        return returnValue;
      }

      //min
      else if (nodeColorAgg=='min'){
        let returnValue;
        curIndices.forEach(j => {
          if (returnValue == null)
            returnValue=dataframe[j][nodeColorBy];
          else
            returnValue=Math.min(returnValue, dataframe[j][nodeColorBy]);
        });
        return returnValue; 
      }

      //median
      else if (nodeColorAgg=='median'){
        let valArray=[];
        let returnValue;
        curIndices.forEach(j => {
            valArray.push(dataframe[j][nodeColorBy]);
        });
        valArray.sort();  
        if (numElements%2!=0)
          return valArray[((numElements+1)/2 - 1)];
        else
          return (valArray[(numElements/2 - 1)]+valArray[(numElements/2)])/2;    
      }

      //SD
      else{
        let valArray=[];
        curIndices.forEach(j => {
          valArray.push(dataframe[j][nodeColorBy]);
        });
        return Math.sqrt(getVariance(valArray));   
        
        //calculate variance of an array
        function getVariance (valArr) {
          const n = valArr.length
          const mean = valArr.reduce((a, b) => a + b) / n
          return valArr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
        }  
      }
    }
    //on change of selected mapper
    const changeSelectedMapper = (event) => {
      //document.getElementById("nodeColorAgg").value = "mean"
      //document.getElementById("nodeColorBy").value = "lens1"
      birefMapperGraph.parent.onBrush([], "MapperGraph"+mapperId, false);
      birefMapperGraph.parent.onMapperChange(parseInt(event.target.value),"MapperGraph"+mapperId)
      setState((prevState)=>({...prevState, selectedMapper:parseInt(event.target.value), nodeColorBy:nodeColorBy, nodeColorAgg:nodeColorAgg}));
    };

    //on change of node feature to color by
    const changeNodeColor = (event) => {
      if (event!="resetFilter"){
        if (event.target.id=="nodeColorBy")
          nodeColorBy=event.target.value;
        else
          nodeColorAgg=event.target.value;
      }
      let colorMin,colorMax;
      [colorMin,colorMax]= d3.extent(dataframe, d=>d[nodeColorBy])

      let nodes=chartGroup.selectAll('.node-mapper-graph')

      for(let i=0; i<nodeNames.length;i++){
        let nodeName=nodeNames[i];
        let numElements=mapper_output.nodes[nodeName].length;
        let colorVal=0;

        //find the colorValue for each node based on selected aggregation
        colorVal= findColorVal(mapper_output.nodes[nodeName], numElements);     
        nodeColorVals[nodeName]=colorVal;
      }
      
      if (nodeColorAgg=='min')
        colorScale=d3.scaleLinear().domain([colorMax, colorMin]).range(["#fffcc5", "#8f0026"]);
      else
        colorScale=d3.scaleLinear().domain([colorMin, colorMax]).range(["#fffcc5", "#8f0026"]);

      nodes.attr("fill",function(d){
          return colorScale(nodeColorVals[d.id]);
        })

      yScaleLegend = d3.scaleLinear()
        .range([svgHeightRange[1]+margins.top, margins.top])
        .domain([colorMin, colorMax]);
          
      globalRef.select(".axis-legend").remove();

      globalRef.append("g")
        .attr("class","axis-legend")
        .attr("transform", `translate(${svgWidthRange[1]+ 11},0 )`)
        .call(d3.axisRight(yScaleLegend).ticks(10))
        .call(g => g.select(".domain").remove());
    };
    
  return (
    <>
      <div id={"mapper-selection-container"+mapperId} className='mapper-selection-container'>
        <div>
          <label htmlFor="mapperSelect">Mapper:&nbsp;</label>
          <select value={state.selectedMapper} id="mapperSelect"  onChange={changeSelectedMapper}>
              {
              mapper_outputs.map((mapper,i) => (
                expl_labels.length>0?
                <option value={i}>{expl_labels[i]}</option>
                :
                <option value={i}>Expl{" "+(i+1)}</option>
                ))}
          </select>
        </div>
        <div>
          <label htmlFor='nodeColorBy'>Node Color:&nbsp;</label>
          <select id="nodeColorBy" onChange={changeNodeColor}>
              {columns.map((column,i) => (
                  <option selected={column==nodeColorBy?true:false} value={column}>{column}</option>
                ))}
          </select>
        </div>
        <div>
          <label htmlFor="nodeColorAgg">Aggregation:&nbsp;</label>
          <select id="nodeColorAgg" onChange={changeNodeColor}>
            <option selected={nodeColorAgg=="mean"?true:false} value="mean">Mean</option>
            <option selected={nodeColorAgg=="median"?true:false} value="median">Median</option>
            <option selected={nodeColorAgg=="sd"?true:false} value="sd">Standard Deviation</option>
            <option selected={nodeColorAgg=="max"?true:false} value="max">Max</option>
            <option selected={nodeColorAgg=="min"?true:false} value="min">Min</option>
          </select>
        </div>
      </div>
      <div id={"densityDisclaimer"+mapperId} style={{display:'none', textAlign:'center'}}>Node Color reflects density of filtered points within that node</div>

      <div className='svg-container'>
      <svg height="373px" width="100%" ref={ref}></svg>
      </div>
    </>
  )
}

export default MapperGraph