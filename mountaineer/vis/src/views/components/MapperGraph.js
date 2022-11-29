//react and react hooks
import React,{useState} from 'react';
import { renderD3 } from '../../hooks/render.hook';


//styles
import './styles/MapperGraph.css'

// d3
import * as d3 from 'd3';




const MapperGraph = ({mapper_outputs, overlaps, birefMapperGraph, dataframe, columns, lensCount, lasso}) => {

  //state to check filtered data
  const [state,setState]=useState({filteredIndices: new Set(), filterStatus: false, selectedMapper:0, nodeColorBy:"lens1", nodeColorAgg:"mean"});
  let mapper_output=mapper_outputs[state.selectedMapper];
  let overlap=overlaps[state.selectedMapper];
  let filteredNodeNames=new Set();


  //Update state when the other component is brushed
  function otherBrushed(selectedIndices, filterStatus){
    setState((prevState)=>({...prevState, filteredIndices :new Set(selectedIndices), filterStatus: filterStatus}));
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

  const render_graph = ( chartGroup, radiusScale, colorScale, distanceScale, data, svgWidthRange, svgHeightRange) => {
    //creating copies of the data 
    let nodes = JSON.parse(JSON.stringify(data.nodes));
    let links = JSON.parse(JSON.stringify(data.links));
    
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
        .force("center", d3.forceCenter(svgWidthRange[1]/2,svgHeightRange[1]/2).strength(1.1) )
        .force("collide", d3.forceCollide().strength(0.8).radius(10).iterations(1));
     
    //links
    let link=chartGroup
      .selectAll(".link-mapper-graph")
      .data(links)
      .enter()
      .append("line")
      .attr("class", function(d){
          if(d.source.nodeVisibility || d.target.nodeVisibility || !state.filterStatus)
            return "link-mapper-graph link-mapper-graph-default";
          else
            return "link-mapper-graph link-mapper-graph-hide";
      })  

    //nodes in graph
    let n=chartGroup
      .selectAll('node')
      .data(nodes)
      .enter()
      .append("circle")
      .attr("fill",function(d){
        return colorScale(d.colorVal);
      })
      //check if nodes are to be shown or hidden
      .attr("class", function(d){
        if (state.filterStatus){
          if (d.nodeVisibility)
            return "node-mapper-graph node-mapper-graph-selected";
          else
            return "node-mapper-graph node-mapper-graph-unselected";
        }
        else
          return "node-mapper-graph"; 
      })
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
        const chartGroup = svgref
            .append("g")
            .attr("transform", `translate(${margins.left},${margins.top})`);

        // svg dimensions
        const svgWidthRange = [0, d3.selectAll('.svg-container').node().getBoundingClientRect().width - margins.left - margins.right];
        const svgHeightRange = [0, d3.selectAll('.svg-container').node().getBoundingClientRect().height - margins.top - margins.bottom];
        svgref.node().style.width=d3.selectAll('.svg-container').node().getBoundingClientRect().width;
        svgref.node().style.height=d3.selectAll('.svg-container').node().getBoundingClientRect().height;

        //converting the input mapper data into appropriate structure for the graph
        let graphData={nodes:[], links:[]};

        //get names of the nodes
        let nodeNames=Object.keys(mapper_output.nodes);

        //To be used to determine scale for the node radius- minimum and max number of elements in a node in the graph
        let minElements= mapper_output.nodes[nodeNames[0]].length;
        let maxElements=minElements;
        let colorMinAvg,colorMaxAvg;
        let overlapExtent=[];

        //iterate through every node in the graph
        for(let i=0; i<nodeNames.length;i++){
          let nodeName=nodeNames[i];

          let numElements=mapper_output.nodes[nodeName].length;
          let colorVal=0;
          minElements=Math.min(minElements,numElements);
          maxElements=Math.max(maxElements,numElements);
          
          //find the colorValue for each node based on selected aggregation
          colorVal= findColorVal(mapper_output.nodes[nodeName], numElements);     
          if (colorMinAvg == null){
            colorMinAvg = colorVal;
            colorMaxAvg = colorVal;  
          }
          colorMinAvg= Math.min(colorMinAvg, colorVal);
          colorMaxAvg= Math.max(colorMaxAvg, colorVal);
          
          let nodeVisibility=true;
          
          if (state.filterStatus && !mapper_output.nodes[nodeName].some((element) => {return state.filteredIndices.has(element)}))
            nodeVisibility=false;
          //update the node data
          graphData.nodes.push({id:nodeName, colorVal:colorVal, numElements:numElements, indices:mapper_output.nodes[nodeName], nodeVisibility:nodeVisibility })
          if (nodeName in mapper_output.links){

            for (let target in mapper_output.links[nodeName]){
              //update the link data
              let curOverlap=overlap[nodeName][mapper_output.links[nodeName][target]]
              graphData.links.push( {source:nodeName, target:mapper_output.links[nodeName][target], linkOverlap: curOverlap});
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

        //scales for color, radii, and distance of the nodes
        const radiusScale = d3.scaleLinear().domain([minElements,maxElements]).range([3,12]);
        let colorScale;
        if (state.nodeColorAgg=='min')
          colorScale=d3.scaleLinear().domain([colorMaxAvg, (colorMaxAvg+colorMinAvg)/2 , colorMinAvg]).range(['#2cba00','#ede40e','#db0f0f']);
        else
          colorScale=d3.scaleLinear().domain([colorMinAvg,(colorMaxAvg+colorMinAvg)/2, colorMaxAvg]).range(['#2cba00','#ede40e','#db0f0f']);

        const distanceScale=d3.scaleLinear().domain(overlapExtent).range([20,1]);
      
        //render the graph
        render_graph( chartGroup, radiusScale, colorScale, distanceScale, graphData, svgWidthRange, svgHeightRange);

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
            birefMapperGraph.parent.onBrush(selectedIndices, "MapperGraph", true);
          }

          //case where no node is selected, disables filters
          else{
            birefMapperGraph.parent.onBrush(selectedIndices, "MapperGraph", false);
          }
        }

      //function to find the colorValue for node based on user selection
      function findColorVal(curIndices, numElements){
        //mean
        if (state.nodeColorAgg=='mean'){
          let returnValue=0;
          curIndices.forEach(j => {
              returnValue+=dataframe[j][state.nodeColorBy];
          });
          returnValue=returnValue/numElements;
          return returnValue;
        }

        //max
        else if (state.nodeColorAgg=='max'){
          let returnValue;
          curIndices.forEach(j => {
            if (returnValue==null)
              returnValue=dataframe[j][state.nodeColorBy];
            else
              returnValue=Math.max(returnValue, dataframe[j][state.nodeColorBy]);
          });
          return returnValue;
        }

        //min
        else if (state.nodeColorAgg=='min'){
          let returnValue;
          curIndices.forEach(j => {
            if (returnValue == null)
              returnValue=dataframe[j][state.nodeColorBy];
            else
              returnValue=Math.min(returnValue, dataframe[j][state.nodeColorBy]);
          });
          return returnValue; 
        }

        //median
        else if (state.nodeColorAgg=='median'){
          let valArray=[];
          let returnValue;
          curIndices.forEach(j => {
              valArray.push(dataframe[j][state.nodeColorBy]);
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
            valArray.push(dataframe[j][state.nodeColorBy]);
          });
          
         
          if (state.nodeColorAgg=='var')  
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
    });

    //on change of selected mapper
    const changeSelectedMapper = (event) => {
      setState((prevState)=>({...prevState, selectedMapper:event.target.value}));
    };

    //on change of node feature to color by
    const changeNodeColorFeature = (event) => {
      setState((prevState)=>({...prevState, nodeColorBy:event.target.value}));
    };

    //on change of aggregation method
    const changeNodeColorAgg = (event) => {
      setState((prevState)=>({...prevState, nodeColorAgg:event.target.value}));
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
          <select value={state.nodeColorBy} id="nodeColorBy"  onChange={changeNodeColorFeature}>
              {columns.map((column,i) => (
                i<columns.length-(lensCount+1)?
                <option value={i}>{column}</option>
                :<option value={column}>{column}</option>
                ))}
          </select>
        </div>
        <div>
          <label htmlFor="nodeColorAgg">Aggregation:&nbsp;</label>
          <select value={state.nodeColorAgg} id="nodeColorAgg"  onChange={changeNodeColorAgg}>
            <option value="mean">Mean</option>
            <option value="median">Median</option>
            <option value="sd">Standard Deviation</option>
            <option value="var">Variance</option>
            <option value="max">Max</option>
            <option value="min">Min</option>
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