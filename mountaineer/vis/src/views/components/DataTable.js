import React, {useState} from 'react';
import PaginatedTable from './PaginatedTable.js';
import FeatureDistributionDensity from './FeatureDistributionDensity.js';

import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import  './styles/DataTable.css'

const DataTable = ({dataframe, birefDataTable, columns, globalSummary}) => {

  //state to check filtered data
  const [state,setState]=useState({selectedTab: 'table', filteredIndices: new Set(), filterStatus: false});

  let tableData=[];
  let distributionValues={};
  let filteredSummary={};
  //Update state when the other component is brushed
  function otherBrushed(selectedIndices, source, filterStatus){
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

    //filteredSummary for filtered data  
    columns.forEach((column, ci)=>{     
      filteredSummary[column] = (tableData.reduce((accumulator, row) => {
        return accumulator + row[column];
      }, 0))/tableData.length; 
    })
  }

  else if (state.selectedTab=="distribution"){

    columns.forEach((column)=>{
      distributionValues[column]={globalMax:0 ,globalMin:0, distribution:[]}
      let globalMax,globalMin;

      dataframe.forEach(( row, i) =>{
        let featureVal= Math.round(row[column]*1000000)/1000000;
        distributionValues[column].distribution.push({ featureVal: featureVal, dist:'global', y:row['y'], lens1:row['lens1']});
        
        if(state.filteredIndices.has(i))
        distributionValues[column].distribution.push({ featureVal: featureVal, dist:'filter1',y:row['y'], lens1:row['lens1']});
        
        if(globalMax===undefined){
          globalMax=featureVal;
          globalMin=featureVal;
        }

        else{
          globalMax=Math.max(featureVal,globalMax)
          globalMin=Math.min(featureVal,globalMin)
        }
      })
      distributionValues[column].globalMax=globalMax
      distributionValues[column].globalMin=globalMin
    })
    
  }

  
  return (
    <Tabs id="TabComponent" activeKey={state.selectedTab} justify={true} variant='tabs' onSelect={(k) =>setState((prevState)=>({...prevState, selectedTab: k}))} transition={false}>
      <Tab eventKey="table" title="Table">
        { state.selectedTab=='table' &&
          <PaginatedTable tableData={tableData} columns={columns} filteredSummary={filteredSummary} globalSummary={globalSummary} filterStatus={state.filterStatus}/>
        }
      </Tab>

      <Tab eventKey="distribution" title="Data Distribution Density">
          {state.selectedTab=='distribution' &&
            <div className='density-container'>
              <FeatureDistributionDensity distributionValues={distributionValues} filterStatus={state.filterStatus} columns={columns}/>
            </div>
          }
      </Tab>
    </Tabs>
  )
}

export default DataTable