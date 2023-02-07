import React, {useState} from 'react';
import PaginatedTable from './PaginatedTable.js';
import FeatureDistributionViolin from './FeatureDistributionViolin.js';
import FeatureDistributionScatter from './FeatureDistributionScatter.js'

import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import  './styles/DataTable.css'

const DataTable = ({dataframe, birefDataTable, columns, lensCount}) => {

  //state to check filtered data
  const [state,setState]=useState({selectedTab: 'table', selectedFeature:"lens1", filteredIndices1: new Set(), filterStatus1: false, filteredIndices2: new Set(), filterStatus2: false });

  let tableData=[];
  let distributionValues=[];
  let globalMax,globalMin;
  let summary={};

  //Update state when the other component is brushed
  function otherBrushed(selectedIndices,filterStatus, source){
    if (source=='MapperGraph1')
      setState((prevState)=>({...prevState, filteredIndices1:new Set(selectedIndices), filterStatus1: filterStatus}));
    else if(source=="MapperGraph2")
      setState((prevState)=>({...prevState, filteredIndices2:new Set(selectedIndices), filterStatus2: filterStatus}));
  } 
  
  //Bidirectional reference object to enable two way communication between parent and child component
  birefDataTable.child={
    otherBrushed: otherBrushed
  };
  
  
  if (state.selectedTab=="table"){
    //filter table data
    if (!state.filterStatus1 && !state.filterStatus2){
      tableData=dataframe;
    }
    else{
      tableData=dataframe.filter((e,i)=>{return (state.filteredIndices1.has(i) || state.filteredIndices2.has(i));})
    }

    //summary for filtered data  
    columns.forEach((column, ci)=>{
      if(ci<columns.length-(lensCount+1)){ 
        summary[column] = (tableData.reduce((accumulator, row) => {
          return accumulator + row[ci];
        }, 0))/tableData.length; 
      }
      else{
        summary[column] = (tableData.reduce((accumulator, row) => {
          return accumulator + row[column];
        }, 0))/tableData.length; 
      }
    })
  }

  else if (state.selectedTab=="distribution"){
    dataframe.forEach(( row, i) =>{
      let featureVal=row[state.selectedFeature].toFixed(6);
      distributionValues.push({ featureVal: featureVal, dist:'global', y:row['y']});
      
      if(state.filteredIndices1.has(i))
        distributionValues.push({ featureVal: featureVal, dist:'filter1',y:row['y']});
      
      if(state.filteredIndices2.has(i))
        distributionValues.push({ featureVal: featureVal, dist:'filter2',y:row['y']});
      
      if(globalMax===undefined){
        globalMax=featureVal;
        globalMin=featureVal;
      }

      else{
        globalMax=Math.max(featureVal,globalMax)
        globalMin=Math.min(featureVal,globalMin)
      }

    })

    
  }

  const changeSelectedFeature = (event) => {
    setState((prevState)=>({...prevState, selectedFeature:event.target.value}));
  };
  
  return (
    <Tabs id="TabComponent" activeKey={state.selectedTab} justify={true} variant='tabs' onSelect={(k) =>setState((prevState)=>({...prevState, selectedTab: k}))} transition={false}>
      <Tab eventKey="distribution" title="Distribution">
          {state.selectedTab=='distribution' &&
            <>
              <div style={{marginTop:'3px', textAlign:'left', paddingLeft:'3px' }}>
                <label htmlFor='selectFeature'>Select Feature:&nbsp;</label>
                <select id='selectFeature' value={state.selectedFeature} onChange={changeSelectedFeature}>
                  {columns.map((column,i) => (
                    i<columns.length-(lensCount+1)?
                    <option value={i}>{column}</option>
                    :<option value={column}>{column}</option>
                ))}
              </select>
              </div>
                <div className='distribution-wrapper'> 
                <div className='violin-container'>
                  <FeatureDistributionViolin distributionValues={distributionValues} globalMax={globalMax} globalMin={globalMin}/>
                </div>
                <div className='scatter-container'>
                  <FeatureDistributionScatter distributionValues={distributionValues} globalMax={globalMax} globalMin={globalMin}/>
                </div>
              </div>
            </>
      
          }
      </Tab>

      <Tab eventKey="table" title="Table">
        { state.selectedTab=='table' &&
          <PaginatedTable tableData={tableData} columns={columns} lensCount={lensCount} summary={summary}/>
        }
      </Tab>
    </Tabs>
  )
}

export default DataTable