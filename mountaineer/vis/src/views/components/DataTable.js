import React, {useState} from 'react';
import PaginatedTable from './PaginatedTable.js';
import FeatureDistributionDensity from './FeatureDistributionDensity.js';

import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import  './styles/DataTable.css'

const DataTable = ({dataframe, birefDataTable, columns, lensCount}) => {

  //state to check filtered data
  const [state,setState]=useState({selectedTab: 'distribution', selectedFeature:"lens1", filteredIndices: new Set(), filterStatus: false});

  let tableData=[];
  let distributionValues=[];
  let globalMax,globalMin;
  let summary={};

  //Update state when the other component is brushed
  function otherBrushed(selectedIndices,filterStatus, source){
    if (source=='MapperGraph1' || source=="MapperGraph2")
      setState((prevState)=>({...prevState, filteredIndices:new Set(selectedIndices.flat()), filterStatus: filterStatus}));
    else if(source=="DataProjection")
      setState((prevState)=>({...prevState, filteredIndices:new Set(selectedIndices), filterStatus: filterStatus}));

  } 
  
  //Bidirectional reference object to enable two way communication between parent and child component
  birefDataTable.child={
    otherBrushed: otherBrushed
  };
  
  if (state.selectedTab=="table"){
    //filter table data
    if (!state.filterStatus)
      tableData=dataframe;
    else
      tableData=dataframe.filter((e,i)=>{return state.filteredIndices.has(i) })

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
      distributionValues.push({ featureVal: featureVal, dist:'global', y:row['y'], lens1:row['lens1']});
      
      if(state.filteredIndices.has(i))
        distributionValues.push({ featureVal: featureVal, dist:'filter1',y:row['y'], lens1:row['lens1']});
      
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
      <Tab eventKey="distribution" title="Data Distribution Density">
          {state.selectedTab=='distribution' &&
            <>
              <div style={{textAlign:'left', paddingLeft:'3px', marginTop:'4px' }}>
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
                <div className='density-container'>
                  <FeatureDistributionDensity distributionValues={distributionValues} globalMax={globalMax} globalMin={globalMin} />
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