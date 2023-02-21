//react and react hooks
import React,{useState} from 'react';
import { renderD3 } from '../../hooks/render.hook';


//styles
import './styles/MapperGraph.css'

// d3
import * as d3 from 'd3';




const MapperGraph = ({input_projection, mapper_outputs, overlaps, birefMapperGraph, dataframe, columns, lensCount, lasso, minElements, maxElements, mapperId, dataRange}) => {

  //state to check filtered data
  const [state,setState]=useState({selectedMapper:mapperId-1, nodeColorBy:"lens1", nodeColorAgg:"var"});
  let chartGroup, colorScale;
  let nodeColorVals={}
  let nodeColorBy=state.nodeColorBy;
  let nodeColorAgg=state.nodeColorAgg;
  let mapper_output=mapper_outputs[state.selectedMapper];
  let overlap=overlaps[state.selectedMapper];
  let nodeNames=Object.keys(mapper_output.nodes);
  let graphData={nodes:[], links:[]};
  

  //Update nodes and links when the other component is brushed
  function otherBrushed(selectedIndices, status, source, xAvg, yAvg){
    let links=chartGroup.selectAll('.link-mapper-graph');
    let nodes=chartGroup.selectAll('.node-mapper-graph')
    //if status is false, reset the view to default
    if(!status){
      links.attr("class","link-mapper-graph link-mapper-graph-default");
      nodes.attr("class","node-mapper-graph");
    }
    //filter out nodes and edges
    else if (source=="DataProjection"){
      let filteredIndices= new Set(selectedIndices);
      let filteredNodeNames= new Set();
      
      for(let i=0; i<nodeNames.length;i++){
        let nodeName=nodeNames[i];
        if (mapper_output.nodes[nodeName].some((element) => {return filteredIndices.has(element)}))
          filteredNodeNames.add(nodeName)
      }

      nodes.attr("class",function(d){
        if (filteredNodeNames.has(d.id))
          return  "node-mapper-graph"
        else
          return "node-mapper-graph node-mapper-graph-unselected";
      });

      links.attr("class",function(d){
        if(filteredNodeNames.has(d.source.id)||filteredNodeNames.has(d.target.id))
          return "link-mapper-graph link-mapper-graph-default"
        else
          return "link-mapper-graph link-mapper-graph-hide"
      });
    }

    else{
        let filteredIndices= new Set(selectedIndices);

        console.log('Mapper1 brushed')
        console.log(nodes)
        let minDistance, minId;
        nodes["_groups"][0].forEach((node)=>{
            //jaccard
            console.log(node)
            let curNodeIndices=new Set(node.__data__.indices)
            let intersection = new Set([...curNodeIndices].filter(index => filteredIndices.has(index)));
            let union = new Set([...filteredIndices, ...curNodeIndices])
            
            if (minDistance==null){
                minDistance= intersection.size/union.size
                minId=node.__data__.id;
            }

            else{
                let curDistance=intersection.size/union.size
                if (curDistance>minDistance){
                    minDistance=curDistance
                    minId=node.__data__.id;
                }
            }
            //centroid
            /*
            if (minDistance==null){
                minDistance=Math.sqrt( ((xAvg - node.__data__.xAvg) * (xAvg - node.__data__.xAvg)) + ((yAvg - node.__data__.yAvg) * (yAvg - node.__data__.yAvg)));
                minId=node.__data__.id;
            }
            else{
                let curDistance=Math.sqrt( ((xAvg - node.__data__.xAvg) * (xAvg - node.__data__.xAvg)) + ((yAvg - node.__data__.yAvg) * (yAvg - node.__data__.yAvg)));
                if (curDistance<minDistance){
                    minDistance=curDistance
                    minId=node.__data__.id;
                }
            }
            */
           
        })
        nodes.attr("class",function(d){
            if (d.id==minId)
              return  "node-mapper-graph"
            else
              return "node-mapper-graph node-mapper-graph-unselected";
          });
    
          links.attr("class",function(d){
            if(d.source.id==minId || d.target.id==minId)
              return "link-mapper-graph link-mapper-graph-default"
            else
              return "link-mapper-graph link-mapper-graph-hide"
          });
    }
  } 
  
  //Bidirectional reference object to enable two way communication between parent and child component
  birefMapperGraph.child={
      otherBrushed: otherBrushed
  };
  
  //selected indices for brushing
  let selectedIndices=new Set();

  //clear plot
  const clear_plot = (svgref) => {
    svgref.selectAll('*').remove();
  }  
  //render the mapper output plot

  const render_graph = (radiusScale, distanceScale, svgWidthRange, svgHeightRange, xScale, yScale) => {
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
        return d3.interpolateRdBu(colorScale(d.colorVal));
      })
     // .attr("cx", function(d){return xScale(d.xAvg)})
       // .attr("cy",function(d){return yScale(d.yAvg)})
      //check if nodes are to be shown or hidden
      .attr("class", "node-mapper-graph")
      //size of nodes based on number of elements
      .attr("r", d=>{return radiusScale(d.numElements);})
      
    function onTick() {
      //update the node positions
      n.attr('cx', function(d) { return d.x; })
          .attr('cy', function(d) { return d.y; })
      
      //update link positions
      link.attr('x1', function(d) { return d.source.x; })
          .attr('y1', function(d) { return d.source.y; })
          .attr('x2', function(d) { return d.target.x; })
          .attr('y2', function(d) { return d.target.y; });
    }

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
        chartGroup = svgref
            .append("g")
            .attr("transform", `translate(${margins.left},${margins.top})`);

        // svg dimensions
        const svgWidthRange = [0, d3.selectAll('.svg-container').node().getBoundingClientRect().width - margins.left - margins.right];
        const svgHeightRange = [0, d3.selectAll('.svg-container').node().getBoundingClientRect().height - margins.top - margins.bottom];
        svgref.node().style.width=d3.selectAll('.svg-container').node().getBoundingClientRect().width;
        svgref.node().style.height=d3.selectAll('.svg-container').node().getBoundingClientRect().height;



        //To be used to determine scale for the node radius- minimum and max number of elements in a node in the graph

        let colorMinAvg,colorMaxAvg;
        let overlapExtent=[];

        //iterate through every node in the graph
        for(let i=0; i<nodeNames.length;i++){
          let nodeName=nodeNames[i];

          let numElements=mapper_output.nodes[nodeName].length;
          let colorVal=0, xAvg, yAvg;
          //find the colorValue for each node based on selected aggregation
          colorVal= findColorVal(mapper_output.nodes[nodeName], numElements);     
          if (colorMinAvg == null){
            colorMinAvg = colorVal;
            colorMaxAvg = colorVal;  
          }
          colorMinAvg= Math.min(colorMinAvg, colorVal);
          colorMaxAvg= Math.max(colorMaxAvg, colorVal);
          
          //find the centroid for each node
          for (let j of mapper_output.nodes[nodeName]){
            if (xAvg==null){
              xAvg=input_projection[j][0];
              yAvg=input_projection[j][1];
            }
            else
            {
              xAvg+=input_projection[j][0];
              yAvg+=input_projection[j][1];
            }
          }
          xAvg=xAvg/numElements;
          yAvg=yAvg/numElements;

          //update the node data
          graphData.nodes.push({id:nodeName, xAvg:xAvg, yAvg:yAvg, colorVal:colorVal, numElements:numElements, indices:mapper_output.nodes[nodeName] })


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

       
  
        //the mapper output will be projected along the same dimensions as the input projection
        const xDomain = [ dataRange[0], dataRange[1] ];
        const yDomain = [ dataRange[2], dataRange[3] ] ;

        //scales for x and y positions, color, and radii of the nodes
        const xScale = d3.scaleLinear().domain(xDomain).range(svgWidthRange);
        const yScale = d3.scaleLinear().domain(yDomain).range([svgHeightRange[1], svgHeightRange[0]]);
        const radiusScale = d3.scaleLinear().domain([minElements,maxElements]).range([6,21]);

        if (nodeColorAgg=='min')
          colorScale=d3.scaleLinear().domain([colorMaxAvg, colorMinAvg]).range([0,1]);
        else
          colorScale=d3.scaleLinear().domain([colorMinAvg, colorMaxAvg]).range([1,0]);

        const distanceScale=d3.scaleLinear().domain(overlapExtent).range([30,5]);
      
        //render the graph
        render_graph(radiusScale, distanceScale, svgWidthRange, svgHeightRange, xScale, yScale);

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
          selectedIndices.clear();

          //reset class of nodes and links
          lassoBrush.items().attr("class","node-mapper-graph");
          let links=chartGroup.selectAll('.link-mapper-graph');
          links.attr("class","link-mapper-graph link-mapper-graph-default");
          
          let nodesSelected=lassoBrush.selectedItems()["_groups"][0];

          if (nodesSelected.length>0){
            let selectedIds=new Set();
            lassoBrush.notSelectedItems().attr("class","node-mapper-graph node-mapper-graph-unselected");
            nodesSelected.forEach((node) =>{
              for(let i=0;i<node.__data__.indices.length;i++){
                selectedIndices.add(node.__data__.indices[i]);
              }
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
          else{
            birefMapperGraph.parent.onBrush(selectedIndices, "MapperGraph"+mapperId, false);
          }
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

      //variance or SD
      else{
        let valArray=[];
        curIndices.forEach(j => {
          valArray.push(dataframe[j][nodeColorBy]);
        });
        
        
        if (nodeColorAgg=='var')  
          return getVariance(valArray);
        else
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
      setState((prevState)=>({...prevState, selectedMapper:event.target.value, nodeColorBy:nodeColorBy, nodeColorAgg:nodeColorAgg}));
    };

    //on change of node feature to color by
    const changeNodeColor = (event) => {
      if (event.target.id=="nodeColorBy")
        nodeColorBy=event.target.value;
      else
        nodeColorAgg=event.target.value;

      let colorMinAvg,colorMaxAvg;
      let nodes=chartGroup.selectAll('.node-mapper-graph')

      for(let i=0; i<nodeNames.length;i++){
        let nodeName=nodeNames[i];
        let numElements=mapper_output.nodes[nodeName].length;
        let colorVal=0;

        //find the colorValue for each node based on selected aggregation
        colorVal= findColorVal(mapper_output.nodes[nodeName], numElements);     
        if (colorMinAvg == null){
          colorMinAvg = colorVal;
          colorMaxAvg = colorVal;  
        }
        colorMinAvg = Math.min(colorMinAvg, colorVal);
        colorMaxAvg = Math.max(colorMaxAvg, colorVal);
        nodeColorVals[nodeName]=colorVal;
      }

      if (nodeColorAgg=='min')
        colorScale=d3.scaleLinear().domain([colorMaxAvg, colorMinAvg]).range([0,1]);
      else
        colorScale=d3.scaleLinear().domain([colorMinAvg, colorMaxAvg]).range([1,0]);

      nodes.attr("fill",function(d){
          return d3.interpolateRdBu(colorScale(nodeColorVals[d.id]));
        })
    };
    
  return (
    <>
      <div className='mapper-selection-container'>

        <div>
          <label htmlFor="mapperSelect">Mapper:&nbsp;</label>
          <select value={state.selectedMapper} id="mapperSelect"  onChange={changeSelectedMapper}>
              {mapper_outputs.map((mapper,i) => (
                <option value={i}>Mapper{i+1}</option>
                ))}
          </select>
        </div>
        <div>
          <label htmlFor='nodeColorBy'>Node Color:&nbsp;</label>
          <select id="nodeColorBy" onChange={changeNodeColor}>
              {columns.map((column,i) => (
                i<columns.length-(lensCount+1)?
                <option selected={column==nodeColorBy?true:false} value={i}>{column}</option>
                :<option selected={column==nodeColorBy?true:false} value={column}>{column}</option>
                ))}
          </select>
        </div>
        <div>
          <label htmlFor="nodeColorAgg">Aggregation:&nbsp;</label>
          <select id="nodeColorAgg" onChange={changeNodeColor}>
            <option selected={nodeColorAgg=="mean"?true:false} value="mean">Mean</option>
            <option selected={nodeColorAgg=="median"?true:false} value="median">Median</option>
            <option selected={nodeColorAgg=="sd"?true:false} value="sd">Standard Deviation</option>
            <option selected={nodeColorAgg=="var"?true:false} value="var">Variance</option>
            <option selected={nodeColorAgg=="max"?true:false} value="max">Max</option>
            <option selected={nodeColorAgg=="min"?true:false} value="min">Min</option>
          </select>
        </div>


      </div>
      <div className='svg-container'>
      <svg ref={ref}></svg>
      </div>
    </>
  )
}

export default MapperGraph